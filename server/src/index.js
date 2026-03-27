import "./load-env.js";
import { validateEnvironment, config } from "./config/environment.js";
import app from "./app.js";
import { SchedulerService } from "./services/scheduler.js";
import { FeedScheduler } from "./services/feed-scheduler.js";
import pool from "./config/database.js";

// Validate env
const envValidation = validateEnvironment();
if (!envValidation.isValid) {
  console.error("Environment errors:");
  envValidation.errors.forEach((msg) => console.error(`   - ${msg}`));
  process.exit(1);
}

const PORT = config.port;
const server = app.listen(PORT, async () => {
  console.log(`\nServer running on http://localhost:${PORT}`);
  console.log(`   Environment : ${config.nodeEnv}`);
  console.log(`   Health      : http://localhost:${PORT}/api/health\n`);
  try {
    SchedulerService.start();
    await FeedScheduler.start();
  } catch (err) {
    console.error("Scheduler error (non-fatal):", err.message);
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} already in use. Kill the process or set PORT= in .env`);
  } else {
    console.error("Server error:", err.message);
  }
  process.exit(1);
});

async function shutdown(signal) {
  console.log(`\n${signal} received - shutting down gracefully...`);
  server.close(async () => {
    try { await pool.end(); } catch { /* ignore */ }
    console.log("Server closed.");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => console.error("Unhandled rejection:", reason));
process.on("uncaughtException", (err) => { console.error("Uncaught exception:", err.message); shutdown("uncaughtException"); });
