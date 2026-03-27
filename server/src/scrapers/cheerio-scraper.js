import axios from 'axios';
import * as cheerio from 'cheerio';
import { config } from '../config/environment.js';

/**
 * Default scraper — fetches the configured SCRAPER_URL and extracts
 * all meaningful anchor links as generic items and notices.
 * Replace SCRAPER_URL in your .env to target any site.
 */
export const CheerioScraper = {
  async scrapeJobs() {
    const url = config.scraper.defaultUrl;
    console.log(`🔍 [Cheerio] Scraping items from ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const $ = cheerio.load(response.data);
    const origin = new URL(url).origin;
    const hostname = new URL(url).hostname.replace('www.', '');
    const items = [];

    $('a').each((index, el) => {
      const $el = $(el);
      const href = $el.attr('href') || '';
      const text = $el.text().trim();

      if (!href || !text || text.split(' ').length < 3 || href.startsWith('javascript:') || href.startsWith('#')) return;

      const finalLink = href.startsWith('http') ? href : `${origin}${href.startsWith('/') ? '' : '/'}${href}`;
      const description = $el.closest('p, li, article, section').text().replace(text, '').trim().slice(0, 200) || text;

      items.push({
        job_id: `default-${index}-${Date.now()}`,
        title: text,
        company: `Scraped from ${hostname}`,
        location: '',
        description,
        salary: '',
        job_type: 'scraped',
        posted_date: new Date(),
        link: finalLink
      });
    });

    // Deduplicate by link, keep first 40
    const unique = Array.from(new Map(items.map(i => [i.link, i])).values()).slice(0, 40);
    console.log(`✅ [Cheerio] Found ${unique.length} items on ${url}`);
    return unique;
  },

  async scrapeNotices() {
    // Default scraper does not produce a separate notices feed.
    // Notices come from generic scraper runs or future site-specific adapters.
    console.log('ℹ️ [Cheerio] No default notices source configured — returning empty array');
    return [];
  }
};

export default CheerioScraper;
