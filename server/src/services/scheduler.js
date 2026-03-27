import cron from 'node-cron';
import { ScraperService } from '../scrapers/index.js';
import { SlackService } from './slack.js';
import { Job, Notice } from '../models/index.js';
import { config } from '../config/environment.js';

export const SchedulerService = {
  cronJob: null,

  async notifyNewItems() {
    // Skip entirely if Slack is not configured — no noise
    if (!config.slack.webhookUrl) return;

    try {
      console.log('\n📬 Checking for new items to notify...');

      const recentJobs = await Job.getRecent(1);
      const recentNotices = await Notice.getRecent(1);

      if (recentJobs.length === 0 && recentNotices.length === 0) {
        console.log('ℹ️ No new items to notify');
        return;
      }

      // Send a single batch digest instead of one message per item
      await SlackService.sendBatchNotification(recentJobs, recentNotices);
      console.log(`✅ Slack batch sent — ${recentJobs.length} items, ${recentNotices.length} notices`);
    } catch (err) {
      console.error('❌ Error in notification check:', err.message);
    }
  },

  start({ runImmediately = false } = {}) {
    const interval = config.scraper.interval;
    const cronExpression = `*/${interval} * * * *`;

    console.log(`⏰ Scheduler starting with interval: ${interval} minutes`);
    console.log(`📅 Cron expression: ${cronExpression}`);

    this.cronJob = cron.schedule(cronExpression, async () => {
      console.log('\n🔔 Scheduled scrape triggered...');
      try {
        await ScraperService.scrapeAndSave();
        await this.notifyNewItems();
      } catch (err) {
        console.error('❌ Scheduled scrape error:', err.message);
      }
    });

    if (runImmediately) {
      console.log('🚀 Running initial scrape...');
      (async () => {
        try {
          await ScraperService.scrapeAndSave();
          await this.notifyNewItems();
        } catch (err) {
          console.error('❌ Initial scrape error:', err.message);
        }
      })();
    } else {
      console.log(`⏭️  Startup scrape skipped — first run in ${interval} min`);
    }

    console.log('✅ Scheduler started successfully');
  },

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('⏹️ Scheduler stopped');
    }
  }
};

export default SchedulerService;
