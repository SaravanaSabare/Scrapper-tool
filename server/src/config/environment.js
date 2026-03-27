import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const cwd = process.cwd();
const isServerDir = path.basename(cwd).toLowerCase() === 'server';
const defaultDataDir = path.resolve(cwd, isServerDir ? '..' : '.', 'data');

export const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Storage
  dataDir: process.env.DATA_DIR || defaultDataDir,

  // AI
  ai: {
    mode: process.env.AI_MODE || 'heuristic',
  },

  // Slack
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
  },

  // Scraper
  scraper: {
    defaultUrl: process.env.SCRAPER_URL || 'https://news.ycombinator.com',
    interval: parseInt(process.env.SCRAPER_INTERVAL || '30', 10),
    retryAttempts: parseInt(process.env.SCRAPER_RETRY_ATTEMPTS || '3', 10),
  },
};

export function validateEnvironment() {
  const errors = [];

  const scraperInterval = Number(process.env.SCRAPER_INTERVAL || 30);
  if (!Number.isInteger(scraperInterval) || scraperInterval <= 0) {
    errors.push('SCRAPER_INTERVAL must be a valid positive integer.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default config;
