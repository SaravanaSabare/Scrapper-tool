import puppeteer from 'puppeteer';
import { config } from '../config/environment.js';

/**
 * Puppeteer fallback — used when Cheerio fails (JS-rendered pages).
 * Targets the same configured SCRAPER_URL as the Cheerio scraper.
 */
export const PuppeteerScraper = {
  async scrapeJobs() {
    const url = config.scraper.defaultUrl;
    let browser;

    try {
      console.log(`🔍 [Puppeteer] Scraping items from ${url}`);

      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      const origin = new URL(url).origin;
      const hostname = new URL(url).hostname.replace('www.', '');

      const items = await page.evaluate((origin, hostname) => {
        const results = [];
        document.querySelectorAll('a').forEach((el, index) => {
          const text = el.textContent?.trim() || '';
          const href = el.getAttribute('href') || '';

          if (!text || text.split(' ').length < 3 || !href || href.startsWith('javascript:') || href.startsWith('#')) return;

          const finalLink = href.startsWith('http') ? href : `${origin}${href.startsWith('/') ? '' : '/'}${href}`;
          const description = el.closest('p, li, article, section')?.textContent?.replace(text, '').trim().slice(0, 200) || text;

          results.push({
            job_id: `puppeteer-${index}-${Date.now()}`,
            title: text,
            company: `Scraped from ${hostname}`,
            location: '',
            description,
            salary: '',
            job_type: 'scraped',
            posted_date: new Date().toISOString(),
            link: finalLink
          });
        });
        return results;
      }, origin, hostname);

      // Deduplicate by link, keep first 40
      const unique = Array.from(new Map(items.map(i => [i.link, i])).values()).slice(0, 40);
      console.log(`✅ [Puppeteer] Found ${unique.length} items on ${url}`);
      return unique;
    } catch (err) {
      console.error('❌ Puppeteer scraping error:', err.message);
      throw err;
    } finally {
      if (browser) await browser.close();
    }
  },

  async scrapeNotices() {
    console.log('ℹ️ [Puppeteer] No default notices source configured — returning empty array');
    return [];
  }
};

export default PuppeteerScraper;
