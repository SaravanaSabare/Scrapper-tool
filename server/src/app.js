/**
 * Pure Express app — no app.listen() here.
 * Imported by:
 *   - server/src/index.js  (local dev: calls app.listen)
 *   - api/index.js         (Vercel serverless: exports as handler)
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment.js';
import pool from './config/database.js';
import jobRoutes from './routes/jobs.js';
import notificationRoutes from './routes/notifications.js';
import feedRoutes from './routes/feeds.js';
import researchRoutes from './routes/research.js';

const app = express();

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — allow Vite dev, preview, any *.vercel.app, and CLIENT_ORIGIN env
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// Rate limits
const globalLimiter = rateLimit({
  windowMs: 60_000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', globalLimiter);

const scrapeLimiter = rateLimit({
  windowMs: 60_000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: 'Scrape rate limit reached. Wait 1 minute.' },
});
app.use('/api/jobs/scrape', scrapeLimiter);

// Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feeds', feedRoutes);
app.use('/api/research', researchRoutes);

// Health
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  try { await pool.query('SELECT 1'); dbStatus = 'connected'; } catch { dbStatus = 'error'; }
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    db: dbStatus,
    ai: process.env.GROQ_API_KEY ? 'groq' : 'heuristic',
  });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
});

export default app;
