import crypto from 'crypto';
import pool from '../config/database.js';
import { analyzeItem } from '../services/ai.js';
import { createItemId, normalizeDate } from '../utils/ids.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

function toIso(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** Merge an ai_insights row (joined columns) back into a .ai object */
function withAi(row) {
  const { summary, tags, category, priority, action_items, item_type, ...rest } = row;
  const hasAi = summary !== undefined || category !== undefined;
  return {
    ...rest,
    id: rest.item_id || rest.id,
    ai: hasAi
      ? { summary: summary || null, tags: tags || [], category: category || null,
          priority: priority || null, action_items: action_items || [] }
      : null,
  };
}

// ─── Job (items table) ────────────────────────────────────────────────────────

export const Job = {
  async findAll() {
    const { rows } = await pool.query(`
      SELECT i.*, a.summary, a.tags, a.category, a.priority, a.action_items, a.item_type
      FROM items i
      LEFT JOIN ai_insights a ON a.item_id = i.item_id AND a.item_type = 'job'
      ORDER BY i.created_at DESC
    `);
    return rows.map(withAi);
  },

  async findById(id) {
    const { rows } = await pool.query(`
      SELECT i.*, a.summary, a.tags, a.category, a.priority, a.action_items, a.item_type
      FROM items i
      LEFT JOIN ai_insights a ON a.item_id = i.item_id AND a.item_type = 'job'
      WHERE i.item_id = $1 OR i.job_id = $1
      LIMIT 1
    `, [id]);
    return rows[0] ? withAi(rows[0]) : null;
  },

  async findByItemId(itemId) {
    const { rows } = await pool.query(
      'SELECT * FROM items WHERE item_id = $1 LIMIT 1',
      [itemId]
    );
    return rows[0] || null;
  },

  async findByJobId(jobId) {
    return this.findById(jobId);
  },

  async create(data) {
    const now = new Date().toISOString();
    const posted_date = toIso(data.posted_date) || now;
    const item_id = data.item_id || createItemId({
      title: data.title, link: data.link, posted_date
    });

    // Dedup check
    const existing = await this.findByItemId(item_id);
    if (existing) {
      const { rows: aiRows } = await pool.query(
        'SELECT * FROM ai_insights WHERE item_id = $1 LIMIT 1', [item_id]
      );
      return withAi({ ...existing, ...(aiRows[0] || {}) });
    }

    const { rows } = await pool.query(`
      INSERT INTO items
        (item_id, job_id, title, company, location, description,
         salary, job_type, feed_id, source, posted_date, link,
         scraped_at, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13,$13)
      RETURNING *
    `, [
      item_id,
      data.job_id      || item_id,
      data.title       || '',
      data.company     || '',
      data.location    || '',
      data.description || '',
      data.salary      || '',
      data.job_type    || '',
      data.feed_id     || null,
      data.source      || null,
      posted_date,
      data.link        || '',
      now,
    ]);

    const record = rows[0];
    const ai = await analyzeItem({ title: record.title, description: record.description });

    await pool.query(`
      INSERT INTO ai_insights (item_id, item_type, summary, tags, category, priority, action_items)
      VALUES ($1, 'job', $2, $3, $4, $5, $6)
      ON CONFLICT (item_id) DO UPDATE
        SET summary=$2, tags=$3, category=$4, priority=$5, action_items=$6, updated_at=NOW()
    `, [item_id, ai.summary, ai.tags, ai.category, ai.priority, ai.action_items]);

    return withAi({ ...record, ...ai });
  },

  async update(id, data) {
    const { rows } = await pool.query(`
      UPDATE items SET
        title       = COALESCE($2, title),
        company     = COALESCE($3, company),
        description = COALESCE($4, description),
        feed_id     = COALESCE($5, feed_id),
        updated_at  = NOW()
      WHERE item_id = $1
      RETURNING *
    `, [id, data.title ?? null, data.company ?? null, data.description ?? null, data.feed_id ?? null]);
    return rows[0] ? withAi(rows[0]) : null;
  },

  async delete(id) {
    await pool.query('DELETE FROM items WHERE item_id = $1', [id]);
  },

  async getRecent(hours = 24) {
    const { rows } = await pool.query(`
      SELECT i.*, a.summary, a.tags, a.category, a.priority, a.action_items, a.item_type
      FROM items i
      LEFT JOIN ai_insights a ON a.item_id = i.item_id AND a.item_type = 'job'
      WHERE i.created_at >= NOW() - ($1 || ' hours')::INTERVAL
      ORDER BY i.created_at DESC
    `, [String(hours)]);
    return rows.map(withAi);
  },

  async findByFeedId(feedId) {
    const { rows } = await pool.query(
      'SELECT * FROM items WHERE feed_id = $1 ORDER BY created_at DESC',
      [feedId]
    );
    return rows;
  }
};

// ─── Notice (notices table) ───────────────────────────────────────────────────

export const Notice = {
  async findAll() {
    const { rows } = await pool.query(`
      SELECT n.*, a.summary, a.tags, a.category, a.priority, a.action_items, a.item_type
      FROM notices n
      LEFT JOIN ai_insights a ON a.item_id = n.item_id AND a.item_type = 'notice'
      ORDER BY n.created_at DESC
    `);
    return rows.map(withAi);
  },

  async findById(id) {
    const { rows } = await pool.query(`
      SELECT n.*, a.summary, a.tags, a.category, a.priority, a.action_items, a.item_type
      FROM notices n
      LEFT JOIN ai_insights a ON a.item_id = n.item_id AND a.item_type = 'notice'
      WHERE n.item_id = $1 OR n.notice_id = $1
      LIMIT 1
    `, [id]);
    return rows[0] ? withAi(rows[0]) : null;
  },

  async findByItemId(itemId) {
    const { rows } = await pool.query(
      'SELECT * FROM notices WHERE item_id = $1 LIMIT 1',
      [itemId]
    );
    return rows[0] || null;
  },

  async findByNoticeId(noticeId) {
    return this.findById(noticeId);
  },

  async create(data) {
    const now = new Date().toISOString();
    const posted_date = toIso(data.posted_date) || now;
    const item_id = data.item_id || createItemId({
      title: data.title, link: data.link, posted_date
    });

    const existing = await this.findByItemId(item_id);
    if (existing) {
      const { rows: aiRows } = await pool.query(
        'SELECT * FROM ai_insights WHERE item_id = $1 LIMIT 1', [item_id]
      );
      return withAi({ ...existing, ...(aiRows[0] || {}) });
    }

    const { rows } = await pool.query(`
      INSERT INTO notices
        (item_id, notice_id, title, content, notice_type, posted_date, link,
         scraped_at, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$8)
      RETURNING *
    `, [
      item_id,
      data.notice_id   || item_id,
      data.title       || '',
      data.content     || '',
      data.notice_type || '',
      posted_date,
      data.link        || '',
      now,
    ]);

    const record = rows[0];
    const ai = await analyzeItem({ title: record.title, content: record.content });

    await pool.query(`
      INSERT INTO ai_insights (item_id, item_type, summary, tags, category, priority, action_items)
      VALUES ($1, 'notice', $2, $3, $4, $5, $6)
      ON CONFLICT (item_id) DO UPDATE
        SET summary=$2, tags=$3, category=$4, priority=$5, action_items=$6, updated_at=NOW()
    `, [item_id, ai.summary, ai.tags, ai.category, ai.priority, ai.action_items]);

    return withAi({ ...record, ...ai });
  },

  async update(id, data) {
    const { rows } = await pool.query(`
      UPDATE notices SET
        title      = COALESCE($2, title),
        content    = COALESCE($3, content),
        updated_at = NOW()
      WHERE item_id = $1
      RETURNING *
    `, [id, data.title ?? null, data.content ?? null]);
    return rows[0] ? withAi(rows[0]) : null;
  },

  async delete(id) {
    await pool.query('DELETE FROM notices WHERE item_id = $1', [id]);
  },

  async getRecent(hours = 24) {
    const { rows } = await pool.query(`
      SELECT n.*, a.summary, a.tags, a.category, a.priority, a.action_items, a.item_type
      FROM notices n
      LEFT JOIN ai_insights a ON a.item_id = n.item_id AND a.item_type = 'notice'
      WHERE n.created_at >= NOW() - ($1 || ' hours')::INTERVAL
      ORDER BY n.created_at DESC
    `, [String(hours)]);
    return rows.map(withAi);
  }
};

// ─── Feed (feeds table) ───────────────────────────────────────────────────────

export const Feed = {
  async findAll() {
    const { rows } = await pool.query(
      'SELECT * FROM feeds ORDER BY created_at DESC'
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM feeds WHERE feed_id = $1 LIMIT 1', [id]
    );
    return rows[0] || null;
  },

  async findActive() {
    const { rows } = await pool.query(
      'SELECT * FROM feeds WHERE active = TRUE ORDER BY created_at DESC'
    );
    return rows;
  },

  async create(data) {
    const feed_id = data.feed_id || crypto.randomUUID();
    const { rows } = await pool.query(`
      INSERT INTO feeds (feed_id, name, url, interval_minutes, active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [
      feed_id,
      data.name  || '',
      data.url   || '',
      Number(data.interval_minutes) || 30,
      data.active !== false && data.active !== 'false',
    ]);
    return rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [id];
    let i = 2;

    if (data.name             !== undefined) { fields.push(`name=$${i++}`);             values.push(data.name); }
    if (data.url              !== undefined) { fields.push(`url=$${i++}`);              values.push(data.url); }
    if (data.interval_minutes !== undefined) { fields.push(`interval_minutes=$${i++}`); values.push(Number(data.interval_minutes)); }
    if (data.active           !== undefined) { fields.push(`active=$${i++}`);           values.push(data.active !== false && data.active !== 'false'); }
    if (data.last_scraped     !== undefined) { fields.push(`last_scraped=$${i++}`);     values.push(data.last_scraped); }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at=NOW()');
    const { rows } = await pool.query(
      `UPDATE feeds SET ${fields.join(', ')} WHERE feed_id = $1 RETURNING *`,
      values
    );
    return rows[0] || null;
  },

  async delete(id) {
    await pool.query('DELETE FROM feeds WHERE feed_id = $1', [id]);
  },

  /** Return a map of feed_id → item count from the items table */
  async getItemCounts() {
    const { rows } = await pool.query(
      `SELECT feed_id, COUNT(*)::int AS item_count
       FROM items
       WHERE feed_id IS NOT NULL
       GROUP BY feed_id`
    );
    const counts = {};
    for (const r of rows) counts[r.feed_id] = r.item_count;
    return counts;
  }
};

export default { Job, Notice, Feed };
