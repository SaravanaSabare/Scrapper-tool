import pool from '../config/database.js';

const statements = [
  // Items table (replaces jobs.xlsx)
  `CREATE TABLE IF NOT EXISTS items (
    id          SERIAL PRIMARY KEY,
    item_id     VARCHAR(255) UNIQUE NOT NULL,
    job_id      VARCHAR(255),
    title       VARCHAR(500) NOT NULL,
    company     VARCHAR(255),
    location    VARCHAR(255),
    description TEXT,
    salary      VARCHAR(100),
    job_type    VARCHAR(100),
    feed_id     VARCHAR(255),
    source      VARCHAR(255),
    posted_date TIMESTAMPTZ,
    link        VARCHAR(1000),
    scraped_at  TIMESTAMPTZ DEFAULT NOW(),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Notices table (replaces notices.xlsx)
  `CREATE TABLE IF NOT EXISTS notices (
    id          SERIAL PRIMARY KEY,
    item_id     VARCHAR(255) UNIQUE NOT NULL,
    notice_id   VARCHAR(255),
    title       VARCHAR(500) NOT NULL,
    content     TEXT,
    notice_type VARCHAR(100),
    posted_date TIMESTAMPTZ,
    link        VARCHAR(1000),
    scraped_at  TIMESTAMPTZ DEFAULT NOW(),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
  )`,

  // AI insights table (replaces ai-insights.json)
  `CREATE TABLE IF NOT EXISTS ai_insights (
    item_id      VARCHAR(255) PRIMARY KEY,
    item_type    VARCHAR(20) NOT NULL DEFAULT 'job',
    summary      TEXT,
    tags         TEXT[],
    category     VARCHAR(100),
    priority     VARCHAR(20),
    action_items TEXT[],
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Feeds table (replaces feeds.xlsx)
  `CREATE TABLE IF NOT EXISTS feeds (
    feed_id          VARCHAR(255) PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    url              VARCHAR(1000) NOT NULL,
    interval_minutes INTEGER NOT NULL DEFAULT 30,
    last_scraped     TIMESTAMPTZ,
    active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Column additions (safe to re-run) ─────────────────────────────────────
  // items
  `ALTER TABLE items ADD COLUMN IF NOT EXISTS item_id   VARCHAR(255)`,
  `ALTER TABLE items ADD COLUMN IF NOT EXISTS job_id    VARCHAR(255)`,
  `ALTER TABLE items ADD COLUMN IF NOT EXISTS feed_id   VARCHAR(255)`,
  `ALTER TABLE items ADD COLUMN IF NOT EXISTS source    VARCHAR(255)`,
  `ALTER TABLE items ADD COLUMN IF NOT EXISTS salary    VARCHAR(100)`,
  `ALTER TABLE items ADD COLUMN IF NOT EXISTS job_type  VARCHAR(100)`,
  `ALTER TABLE items ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ DEFAULT NOW()`,
  `ALTER TABLE items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,

  // notices
  `ALTER TABLE notices ADD COLUMN IF NOT EXISTS item_id    VARCHAR(255)`,
  `ALTER TABLE notices ADD COLUMN IF NOT EXISTS notice_id  VARCHAR(255)`,
  `ALTER TABLE notices ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ DEFAULT NOW()`,
  `ALTER TABLE notices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,

  // Backfill item_id from id where null (items)
  `UPDATE items SET item_id = id::text WHERE item_id IS NULL`,

  // Backfill item_id from id where null (notices)
  `UPDATE notices SET item_id = id::text WHERE item_id IS NULL`,

  // Add UNIQUE constraint on item_id if not exists (items) — safe via DO block
  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'items_item_id_key'
     ) THEN
       ALTER TABLE items ADD CONSTRAINT items_item_id_key UNIQUE (item_id);
     END IF;
   END $$`,

  // Add UNIQUE constraint on item_id if not exists (notices)
  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'notices_item_id_key'
     ) THEN
       ALTER TABLE notices ADD CONSTRAINT notices_item_id_key UNIQUE (item_id);
     END IF;
   END $$`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_items_item_id      ON items(item_id)`,
  `CREATE INDEX IF NOT EXISTS idx_items_feed_id      ON items(feed_id)`,
  `CREATE INDEX IF NOT EXISTS idx_items_created_at   ON items(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_notices_item_id    ON notices(item_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_feeds_active       ON feeds(active)`,
];

export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  for (const sql of statements) {
    try {
      await pool.query(sql);
    } catch (err) {
      console.error('❌ Migration error:', err.message);
      console.error('   SQL:', sql.trim().split('\n')[0]);
      throw err;
    }
  }
  console.log('✅ Migrations completed successfully');
}

export default runMigrations;
