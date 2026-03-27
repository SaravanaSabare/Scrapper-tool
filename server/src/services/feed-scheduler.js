import cron from 'node-cron';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Feed, Job } from '../models/index.js';
import { createItemId } from '../utils/ids.js';
import { SlackService } from './slack.js';

// In-memory map of feed_id → { task, itemCount }
const _tasks = new Map();

// ─── Core scrape for a single feed ─────────────────────────────────────────────

async function scrapeFeedUrl(feed) {
  const rawUrl = (feed.url || '').trim();
  const url = rawUrl.match(/^https?:\/\//i) ? rawUrl : `https://${rawUrl}`;

  console.log(`\n⚡ Feed scrape [${feed.name}]: ${url}`);

  let hostname;
  try {
    hostname = new URL(url).hostname.replace('www.', '');
  } catch {
    throw new Error(`Invalid feed URL: ${url}`);
  }

  const response = await axios.get(url, {
    timeout: 30000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });

  const $ = cheerio.load(response.data);
  const baseUrl = new URL(url).origin;
  const rawItems = [];

  $('a').each((i, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const text = $el.text().trim();
    if (!href || !text || text.split(' ').length < 3 || href.startsWith('javascript:')) return;

    let description = $el.parent().text().replace(text, '').trim().slice(0, 200);
    if (!description) {
      description = $el.parent().parent().text().replace(text, '').trim().slice(0, 200) || text;
    }

    const finalLink = href.startsWith('http')
      ? href
      : href.startsWith('/')
        ? `${baseUrl}${href}`
        : `${baseUrl}/${href}`;

    rawItems.push({ text, finalLink, description });
  });

  // Deduplicate + cap
  const unique = Array.from(new Map(rawItems.map((r) => [r.finalLink, r])).values()).slice(0, 50);

  let newCount = 0;
  for (const { text, finalLink, description } of unique) {
    try {
      const posted_date = new Date().toISOString();
      const item_id = createItemId({ title: text, link: finalLink, posted_date });
      const existing = await Job.findByItemId(item_id);
      if (!existing) {
        await Job.create({
          item_id,
          title: text,
          description,
          link: finalLink,
          company: `Feed: ${feed.name}`,
          source: hostname,
          feed_id: feed.feed_id,
          posted_date
        });
        newCount++;
      }
    } catch (err) {
      console.error(`  Error saving feed item: ${err.message}`);
    }
  }

  console.log(`  ✅ [${feed.name}] ${newCount} new items from ${unique.length} found`);

  // Update last_scraped on the feed record (fire-and-forget is fine here)
  Feed.update(feed.feed_id, { last_scraped: new Date().toISOString() }).catch(() => {});

  // Bump in-memory item count
  const prev = _tasks.get(feed.feed_id) || {};
  _tasks.set(feed.feed_id, { ..._tasks.get(feed.feed_id), itemCount: (prev.itemCount || 0) + newCount });

  // Notify via Slack if new items found
  if (newCount > 0 && SlackService) {
    try {
      const recentItems = await Job.getRecent(1);
      const feedItems = recentItems.filter((j) => j.feed_id === feed.feed_id).slice(0, 3);
      for (const item of feedItems) {
        await SlackService.sendNewItemNotification(item);
      }
    } catch (slackErr) {
      console.warn(`  ⚠️ Slack notify failed: ${slackErr.message}`);
    }
  }

  return { feedId: feed.feed_id, itemsFound: unique.length, newCount };
}

// ─── Public API ─────────────────────────────────────────────────────────────────

export const FeedScheduler = {
  /** Build a cron expression from interval_minutes (min 5) */
  _toCron(intervalMinutes) {
    const mins = Math.max(5, Number(intervalMinutes) || 30);
    if (mins < 60) return `*/${mins} * * * *`;
    const hours = Math.floor(mins / 60);
    return `0 */${hours} * * *`;
  },

  /** Schedule a single feed; replaces any existing task for that id */
  scheduleFeed(feed) {
    this.cancelFeed(feed.feed_id);
    if (!feed.active) return;

    const expr = this._toCron(feed.interval_minutes);
    console.log(`📡 Scheduling feed [${feed.name}] — ${expr}`);

    const task = cron.schedule(expr, async () => {
      try {
        await scrapeFeedUrl(feed);
      } catch (err) {
        console.error(`❌ Feed cron error [${feed.name}]:`, err.message);
      }
    });

    _tasks.set(feed.feed_id, { task, itemCount: _tasks.get(feed.feed_id)?.itemCount ?? 0 });
  },

  /** Cancel + re-schedule (called on PATCH) */
  rescheduleFeed(feed) {
    this.cancelFeed(feed.feed_id);
    if (feed.active) this.scheduleFeed(feed);
  },

  /** Stop and remove a feed's cron task */
  cancelFeed(feedId) {
    const entry = _tasks.get(feedId);
    if (entry?.task) {
      entry.task.stop();
      _tasks.set(feedId, { ..._tasks.get(feedId), task: null });
    }
  },

  /** Manually trigger a feed scrape (API route handler) */
  async scrapeOneFeed(feed) {
    return scrapeFeedUrl(feed);
  },

  /** Return a map of feed_id → item_count accumulated this session */
  getItemCounts() {
    const counts = {};
    for (const [id, entry] of _tasks.entries()) {
      counts[id] = entry.itemCount ?? 0;
    }
    return counts;
  },

  /** Load all active feeds from storage and schedule them; called on startup */
  async start({ runImmediately = false } = {}) {
    const feeds = await Feed.findActive();
    console.log(`📡 FeedScheduler: ${feeds.length} active feed(s) found`);
    for (const feed of feeds) {
      this.scheduleFeed(feed);
      if (runImmediately) {
        try {
          await scrapeFeedUrl(feed);
        } catch (err) {
          console.error(`❌ Startup scrape failed for feed [${feed.name}]:`, err.message);
        }
      }
    }
    if (!runImmediately && feeds.length > 0) {
      console.log(`⏭️  Feed startup scrapes skipped — will run on first cron tick`);
    }
  },

  /** Stop all feed cron tasks */
  stop() {
    for (const [id] of _tasks.entries()) {
      this.cancelFeed(id);
    }
    console.log('⏹️ FeedScheduler stopped');
  }
};

export default FeedScheduler;
