/**
 * Vercel Serverless Function entry point.
 * All /api/* requests are forwarded here from vercel.json rewrites.
 *
 * We import the Express app from the server package and export it as the
 * default handler — Vercel supports Express apps directly.
 */
import '../server/src/load-env.js';  // loads .env before anything else
import app from '../server/src/app.js';

export default app;
