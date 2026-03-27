/**
 * Vercel Serverless Function entry point.
 * All /api/* requests are forwarded here via vercel.json rewrites.
 *
 * Vercel injects environment variables natively — no dotenv needed.
 * Express app is exported directly as the serverless handler.
 */
import app from "../server/src/app.js";

export default app;
