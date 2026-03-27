import CheerioScraper from './cheerio-scraper.js';
import PuppeteerScraper from './puppeteer-scraper.js';
import GenericScraper from './generic-scraper.js';
import { Job, Notice } from '../models/index.js';
import { createItemId } from '../utils/ids.js';

export const ScraperService = {
  GenericScraper,

  async scrapeJobsWithFallback() {
    try {
      // Try Cheerio first (faster)
      const jobs = await CheerioScraper.scrapeJobs();
      return jobs;
    } catch (err) {
      console.warn('⚠️ Cheerio scraper failed, falling back to Puppeteer...');
      try {
        const jobs = await PuppeteerScraper.scrapeJobs();
        return jobs;
      } catch (fallbackErr) {
        console.error('❌ Both scrapers failed');
        throw fallbackErr;
      }
    }
  },

  async scrapeNoticesWithFallback() {
    try {
      // Try Cheerio first (faster)
      const notices = await CheerioScraper.scrapeNotices();
      return notices;
    } catch (err) {
      console.warn('⚠️ Cheerio scraper failed, falling back to Puppeteer...');
      try {
        const notices = await PuppeteerScraper.scrapeNotices();
        return notices;
      } catch (fallbackErr) {
        console.error('❌ Both scrapers failed');
        throw fallbackErr;
      }
    }
  },

  async scrapeAndSave() {
    console.log('\n🚀 Starting scrape and save process...');
    const startTime = Date.now();

    try {
      // Scrape jobs
      const jobs = await this.scrapeJobsWithFallback();
      let newJobsCount = 0;

      for (const jobData of jobs) {
        try {
          const item_id = createItemId({
            title: jobData.title,
            link: jobData.link,
            posted_date: jobData.posted_date
          });
          const existing = await Job.findByItemId(item_id);
          if (!existing) {
            await Job.create({ ...jobData, item_id });
            newJobsCount++;
          }
        } catch (err) {
          console.error(`Error saving job ${jobData.job_id}:`, err.message);
        }
      }

      // Scrape notices
      const notices = await this.scrapeNoticesWithFallback();
      let newNoticesCount = 0;

      for (const noticeData of notices) {
        try {
          const item_id = createItemId({
            title: noticeData.title,
            link: noticeData.link,
            posted_date: noticeData.posted_date
          });
          const existing = await Notice.findByItemId(item_id);
          if (!existing) {
            await Notice.create({ ...noticeData, item_id });
            newNoticesCount++;
          }
        } catch (err) {
          console.error(`Error saving notice ${noticeData.notice_id}:`, err.message);
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Scrape completed in ${duration}s`);
      console.log(`   📋 New items: ${newJobsCount}`);
      console.log(`   📢 New notices: ${newNoticesCount}`);

      return { newJobsCount, newNoticesCount };
    } catch (err) {
      console.error('❌ Scrape and save failed:', err.message);
      throw err;
    }
  }
};

export default ScraperService;
