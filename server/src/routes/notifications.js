import express from 'express';
import { Job, Notice } from '../models/index.js';
import { SlackService } from '../services/slack.js';

const router = express.Router();

// Get all notices
router.get('/', async (req, res) => {
  try {
    const notices = await Notice.findAll();
    res.json({ success: true, data: notices, count: notices.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single notice
router.get('/:id', async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, error: 'Notice not found' });
    }
    res.json({ success: true, data: notice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get recent notices
router.get('/recent/:hours', async (req, res) => {
  try {
    const hours = parseInt(req.params.hours, 10) || 24;
    const notices = await Notice.getRecent(hours);
    res.json({ success: true, data: notices, count: notices.length, hours });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send test Slack notification
router.post('/test/slack', async (req, res) => {
  try {
    const testItem = {
      title: 'Test Scraper Item',
      category: 'announcement',
      priority: 'medium',
      source: 'test-suite',
      description: 'This is a test notification from the scraper pipeline.',
      link: 'https://example.com/test-item'
    };

    await SlackService.sendNewItemNotification(testItem);
    res.json({ success: true, message: 'Test Slack notification sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send batch notification
router.post('/batch', async (req, res) => {
  try {
    const jobs = await Job.getRecent(24);
    const notices = await Notice.getRecent(24);
    await SlackService.sendBatchNotification(jobs, notices);

    res.json({ 
      success: true, 
      message: 'Batch notifications sent to Slack',
      jobs: jobs.length,
      notices: notices.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
