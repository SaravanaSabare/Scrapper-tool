import express from 'express';
import { Feed, Job } from '../models/index.js';
import { FeedScheduler } from '../services/feed-scheduler.js';

const router = express.Router();

// GET /api/feeds — list all feeds with live item counts
router.get('/', async (req, res) => {
  try {
    const feeds = await Feed.findAll();
    const counts = await Feed.getItemCounts();          // DB query, not in-memory
    const data = feeds.map((f) => ({ ...f, item_count: counts[f.feed_id] ?? 0 }));
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/feeds — create a new feed
router.post('/', async (req, res) => {
  try {
    const { name, url, interval_minutes } = req.body;
    if (!name || !url) {
      return res.status(400).json({ success: false, error: 'name and url are required' });
    }
    const feed = await Feed.create({ name, url, interval_minutes: Number(interval_minutes) || 30 });
    FeedScheduler.scheduleFeed(feed);
    res.status(201).json({ success: true, data: feed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/feeds/:id — update a feed (toggle active, change interval, rename)
router.patch('/:id', async (req, res) => {
  try {
    const updated = await Feed.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Feed not found' });
    FeedScheduler.rescheduleFeed(updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/feeds/:id — remove a feed
router.delete('/:id', async (req, res) => {
  try {
    const feed = await Feed.findById(req.params.id);
    if (!feed) return res.status(404).json({ success: false, error: 'Feed not found' });
    FeedScheduler.cancelFeed(req.params.id);
    await Feed.delete(req.params.id);
    res.json({ success: true, message: 'Feed deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/feeds/:id/items — list items scraped by this feed
router.get('/:id/items', async (req, res) => {
  try {
    const items = await Job.findByFeedId(req.params.id);
    res.json({ success: true, data: items, count: items.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/feeds/:id/scrape — manually trigger a feed scrape
router.post('/:id/scrape', async (req, res) => {
  try {
    const feed = await Feed.findById(req.params.id);
    if (!feed) return res.status(404).json({ success: false, error: 'Feed not found' });
    const result = await FeedScheduler.scrapeOneFeed(feed);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
