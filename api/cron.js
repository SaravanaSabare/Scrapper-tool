/**
 * Vercel Cron Job handler.
 *
 * Called automatically by Vercel on the schedule defined in vercel.json.
 * Secured via CRON_SECRET — Vercel sends it in the Authorization header.
 *
 * What it does:
 *   1. Scrapes all active feeds from the DB
 *   2. Runs the default SCRAPER_URL scrape (if configured)
 *   3. Returns a summary of results
 */
import pool from '../server/src/config/database.js';
import { Feed, Job } from '../server/src/models/index.js';
import { ScraperService } from '../server/src/scrapers/index.js';
import { createItemId } from '../server/src/utils/ids.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

// ── Auth ────────────────────────────────────────────────────────────────────────

function isAuthorized(req) {
  // Vercel injects CRON_SECRET and sends it as `Authorization: Bearer <secret>`
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured → allow (dev convenience)
  const authHeader = req.headers['authorization'] || '';
  return authHeader === `Bearer ${secret}`;
}

// ── Feed scraper (inline — same logic as feed-scheduler.js) ─────────────────────

async function scrapeFeedUrl(feed) {
  const rawUrl = (feed.url || '').trim();
  const url = rawUrl.match(/^https?:\/\//i) ? rawUrl : `https://${rawUrl}`;

  let hostname;
  try {
    hostname = new URL(url).hostname.replace('www.', '');
  } catch {
    throw new Error(`Invalid feed URL: ${url}`);
  }

  const response = await axios.get(url, {
    timeout: 30_000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });

  const $ = cheerio.load(response.data);
  const baseUrl = new URL(url).origin;
  const rawItems = [];

  $('a').each((_i, el) => {
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
          posted_date,
        });
        newCount++;
      }
    } catch (err) {
      console.error(`  Feed item error: ${err.message}`);
    }
  }

  // Update last_scraped timestamp
  await Feed.update(feed.feed_id, { last_scraped: new Date().toISOString() }).catch(() => {});

  return { feed: feed.name, itemsFound: unique.length, newItems: newCount };
}

// ── Handler ─────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const start = Date.now();

  // Only allow GET (Vercel cron) and POST (manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = { feeds: [], defaultScrape: null, errors: [] };

  try {
    // 1. Scrape all active feeds
    const activeFeeds = await Feed.findActive();
    console.log(`🕐 Cron: ${activeFeeds.length} active feed(s)`);

    for (const feed of activeFeeds) {
      try {
        const result = await scrapeFeedUrl(feed);
        results.feeds.push(result);
        console.log(`  ✅ [${feed.name}] ${result.newItems} new / ${result.itemsFound} found`);
      } catch (err) {
        const msg = `Feed [${feed.name}] failed: ${err.message}`;
        console.error(`  ❌ ${msg}`);
        results.errors.push(msg);
      }
    }

    // 2. Run default scraper (SCRAPER_URL) if configured
    const scraperUrl = process.env.SCRAPER_URL;
    if (scraperUrl) {
      try {
        console.log(`🕐 Cron: default scrape → ${scraperUrl}`);
        await ScraperService.scrapeAndSave();
        results.defaultScrape = { url: scraperUrl, status: 'ok' };
        console.log(`  ✅ Default scrape complete`);
      } catch (err) {
        const msg = `Default scrape failed: ${err.message}`;
        console.error(`  ❌ ${msg}`);
        results.errors.push(msg);
        results.defaultScrape = { url: scraperUrl, status: 'error', error: err.message };
      }
    }
  } catch (err) {
    console.error('Cron fatal error:', err.message);
    results.errors.push(`Fatal: ${err.message}`);
  }

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  const totalNew = results.feeds.reduce((sum, f) => sum + f.newItems, 0);

  console.log(`✅ Cron complete in ${duration}s — ${totalNew} new items across ${results.feeds.length} feeds`);

  return res.status(200).json({
    success: true,
    duration: `${duration}s`,
    feedsProcessed: results.feeds.length,
    totalNewItems: totalNew,
    results,
  });
}
