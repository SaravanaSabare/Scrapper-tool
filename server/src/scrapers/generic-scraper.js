import axios from 'axios';
import * as cheerio from 'cheerio';
import { analyzeItem } from '../services/ai.js';
import { createItemId } from '../utils/ids.js';

export const GenericScraper = {
  /**
   * Scrape a URL, run AI analysis on each item, and return the enriched
   * array.  NO Supabase writes � results are session-only on the client.
   */
  async scrapeUrl(url) {
    const rawUrl = (url || '').trim();
    if (!rawUrl) throw new Error('URL is required');

    const normalizedUrl = rawUrl.match(/^https?:\/\//i) ? rawUrl : `https://${rawUrl}`;

    let siteDetails;
    try {
      siteDetails = new URL(normalizedUrl);
    } catch {
      throw new Error('Invalid URL format');
    }

    console.log(`\n?? Session scrape: ${normalizedUrl}`);

    const response = await axios.get(normalizedUrl, {
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const $ = cheerio.load(response.data);
    const baseUrl = siteDetails.origin;
    const sitename = siteDetails.hostname.replace('www.', '');
    const raw = [];

    $('a').each((_i, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();

      if (!href || !text || text.split(' ').length < 3 || href.startsWith('javascript:')) return;

      let description = $el.parent().text().replace(text, '').trim().slice(0, 300);
      if (!description) {
        description = $el.parent().parent().text().replace(text, '').trim().slice(0, 300) || text;
      }

      const finalLink = href.startsWith('http')
        ? href
        : href.startsWith('/')
          ? `${baseUrl}${href}`
          : `${baseUrl}/${href}`;

      raw.push({
        title: text,
        company: `Scraped from ${sitename}`,
        location: 'Web',
        description,
        salary: '',
        job_type: 'Custom Scrape',
        source: sitename,
        posted_date: new Date().toISOString(),
        link: finalLink,
      });
    });

    // Deduplicate by link, cap at 50
    const unique = Array.from(new Map(raw.map(i => [i.link, i])).values()).slice(0, 50);
    console.log(`   Found ${unique.length} unique items � enriching with AI...`);

    // Enrich each item with AI in small batches to respect rate limits
    const BATCH = 5;
    const enriched = [];
    for (let i = 0; i < unique.length; i += BATCH) {
      const batch = unique.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map(async (item) => {
          const ai = await analyzeItem({ title: item.title, description: item.description });
          const item_id = createItemId({ title: item.title, link: item.link, posted_date: item.posted_date });
          return { ...item, item_id, ai };
        })
      );
      enriched.push(...results);
    }

    console.log(`? Session scrape complete � ${enriched.length} items enriched.`);
    return enriched;
  }
};

export default GenericScraper;
