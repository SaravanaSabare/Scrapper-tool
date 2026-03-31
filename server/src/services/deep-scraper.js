import axios from 'axios';
import * as cheerio from 'cheerio';
import { analyzeItem } from './ai.js';

/**
 * Deep-scrape a single URL:
 *   1. Fetch the page HTML
 *   2. Extract article/main content (title, body text, images, metadata)
 *   3. Run AI analysis on the full extracted content
 *   4. Return enriched result
 */

// Selectors ordered by specificity — first match wins
const CONTENT_SELECTORS = [
  'article',
  '[role="main"]',
  'main',
  '.post-content',
  '.article-content',
  '.article-body',
  '.entry-content',
  '.story-body',
  '.post-body',
  '#article-body',
  '.content-body',
  '.wysiwyg',
];

const META_SELECTORS = {
  title: [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'h1',
    'title',
  ],
  description: [
    'meta[property="og:description"]',
    'meta[name="description"]',
    'meta[name="twitter:description"]',
  ],
  image: [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
  ],
  author: [
    'meta[name="author"]',
    'meta[property="article:author"]',
    '[rel="author"]',
    '.author-name',
    '.byline',
  ],
  published: [
    'meta[property="article:published_time"]',
    'meta[name="publish-date"]',
    'time[datetime]',
  ],
};

function extractMeta($, selectors) {
  for (const sel of selectors) {
    const $el = $(sel).first();
    if (!$el.length) continue;
    // meta tags → content attr, time → datetime attr, else text
    const val = $el.attr('content') || $el.attr('datetime') || $el.text().trim();
    if (val) return val;
  }
  return null;
}

function extractContent($) {
  // Try each content selector
  for (const sel of CONTENT_SELECTORS) {
    const $el = $(sel).first();
    if (!$el.length) continue;

    // Remove scripts, styles, nav, footer, ads, sidebars
    $el.find('script, style, nav, footer, aside, .ad, .ads, .sidebar, .related, .comments, .social-share, noscript, iframe').remove();

    const paragraphs = [];
    $el.find('p, li, h2, h3, h4, blockquote').each((_i, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) paragraphs.push(text);
    });

    if (paragraphs.length > 0) {
      return paragraphs.join('\n\n');
    }

    // Fallback: raw text
    const rawText = $el.text().replace(/\s+/g, ' ').trim();
    if (rawText.length > 100) return rawText;
  }

  // Last resort: body text
  const body = $('body').clone();
  body.find('script, style, nav, footer, header, aside').remove();
  return body.text().replace(/\s+/g, ' ').trim().slice(0, 5000);
}

function extractImages($, baseUrl) {
  const images = [];
  const seen = new Set();

  // OG image first
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    const abs = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;
    images.push(abs);
    seen.add(abs);
  }

  // Article images
  $('article img, main img, [role="main"] img, .post-content img, .article-body img').each((_i, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (!src) return;
    const abs = src.startsWith('http') ? src : src.startsWith('/') ? `${baseUrl}${src}` : `${baseUrl}/${src}`;
    if (!seen.has(abs) && !abs.includes('icon') && !abs.includes('logo') && !abs.includes('avatar')) {
      images.push(abs);
      seen.add(abs);
    }
  });

  return images.slice(0, 5);
}

/**
 * Deep-scrape a single URL and return structured content.
 */
export async function deepScrapeUrl(url) {
  const normalizedUrl = url.match(/^https?:\/\//i) ? url : `https://${url}`;

  let origin;
  try {
    origin = new URL(normalizedUrl).origin;
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  console.log(`🔬 Deep scrape: ${normalizedUrl}`);

  const response = await axios.get(normalizedUrl, {
    timeout: 30_000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    maxRedirects: 5,
  });

  const $ = cheerio.load(response.data);

  const title       = extractMeta($, META_SELECTORS.title) || 'Untitled';
  const description = extractMeta($, META_SELECTORS.description) || '';
  const author      = extractMeta($, META_SELECTORS.author) || null;
  const published   = extractMeta($, META_SELECTORS.published) || null;
  const ogImage     = extractMeta($, META_SELECTORS.image) || null;
  const fullContent = extractContent($);
  const images      = extractImages($, origin);
  const wordCount   = fullContent.split(/\s+/).length;

  // AI analysis on full content (truncated to 2000 chars for the prompt)
  const ai = await analyzeItem({
    title,
    description: fullContent.slice(0, 2000),
  });

  console.log(`   ✅ Deep scrape complete — ${wordCount} words, ${images.length} images`);

  return {
    url: normalizedUrl,
    title,
    description,
    author,
    published_date: published,
    full_content: fullContent.slice(0, 10_000), // Cap at 10k chars
    word_count: wordCount,
    images,
    og_image: ogImage,
    ai,
  };
}

export default { deepScrapeUrl };
