import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

// Load .env FIRST before any module reads process.env
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config, validateEnvironment } from './config/environment.js';
import jobRoutes from './routes/jobs.js';
import notificationRoutes from './routes/notifications.js';
import feedRoutes from './routes/feeds.js';
import researchRoutes from './routes/research.js';
import { SchedulerService } from './services/scheduler.js';
import { FeedScheduler } from './services/feed-scheduler.js';
import pool from './config/database.js';

// ─── Validate env ─────────────────────────────────────────────────────────────
const envValidation = validateEnvironment();
if (!envValidation.isValid) {
  console.error('❌ Environment errors:');
  envValidation.errors.forEach((msg) => console.error(`   - ${msg}`));
  process.exit(1);
}

// ─── Express app ──────────────────────────────────────────────────────────────
const app = express();

// Security headers (relaxed CSP so API-only server doesn't block anything)
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — allow Vite dev (5173) and production origin from env
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',  // vite preview
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
];
app.use(cors({
  origin: (origin, cb) => {
    // allow no-origin requests (curl, Postman, health checks)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// HTTP request logging — concise in dev, combined in production
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// Global rate limit — 200 req/min per IP (scrape endpoint has its own below)
const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', globalLimiter);

// Scrape endpoint stricter limit — 10 req/min
const scrapeLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Scrape rate limit reached. Wait 1 minute.' },
});
app.use('/api/jobs/scrape', scrapeLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/jobs', jobRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feeds', feedRoutes);
app.use('/api/research', researchRoutes);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    storage: 'supabase',
    db: dbStatus,
    ai: process.env.GROQ_API_KEY ? 'groq' : 'heuristic',
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled error:', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── Start — server ref at module level to keep event loop alive ──────────────
const PORT = config.port;
const server = app.listen(PORT, async () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`   Environment : ${config.nodeEnv}`);
  console.log(`   Health      : http://localhost:${PORT}/api/health\n`);

  try {
    SchedulerService.start();
    await FeedScheduler.start();
  } catch (err) {
    console.error('⚠️  Scheduler error (non-fatal):', err.message);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} already in use. Kill the process or set PORT= in .env`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n⏹  ${signal} received — shutting down gracefully…`);
  server.close(async () => {
    try { await pool.end(); } catch { /* ignore */ }
    console.log('✅ Server closed.');
    process.exit(0);
  });
  // Force-kill after 10 s
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Catch unhandled promise rejections so the process doesn't crash silently
process.on('unhandledRejection', (reason) => {
  console.error('⚠️  Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught exception:', err.message);
  shutdown('uncaughtException');
});

export default app;
