import express from 'express';
import { Job, Notice } from '../models/index.js';
import { ScraperService } from '../scrapers/index.js';
import { deepScrapeUrl } from '../services/deep-scraper.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const jobs = await Job.findAll();
    res.json({ success: true, data: jobs, count: jobs.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/recent/:hours', async (req, res) => {
  try {
    const hours = parseInt(req.params.hours, 10) || 24;
    const jobs = await Job.getRecent(hours);
    res.json({ success: true, data: jobs, count: jobs.length, hours });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    if (url) {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        return res.status(400).json({ success: false, error: 'URL cannot be empty' });
      }
      console.log('Session scrape triggered for URL:', trimmedUrl);
      // GenericScraper now returns enriched items[] — no DB writes
      const items = await ScraperService.GenericScraper.scrapeUrl(trimmedUrl);
      return res.json({
        success: true,
        message: 'Successfully scraped',
        data: { items, itemsFound: items.length }
      });
    }
    // Default feed scrape (still writes to Supabase for background intelligence)
    console.log('Manual default scrape triggered via API');
    const result = await ScraperService.scrapeAndSave();
    res.json({ success: true, message: 'Default scrape completed', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/jobs/deep-scrape — follow a URL and extract full article content
router.post('/deep-scrape', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ success: false, error: 'url is required' });
    }
    const result = await deepScrapeUrl(url.trim());
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Deep scrape error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.length > 128) {
      return res.status(400).json({ success: false, error: 'Invalid id' });
    }
    const existing = await Job.findById(id);
    if (!existing) return res.status(404).json({ success: false, error: 'Item not found' });
    await Job.delete(id);
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

