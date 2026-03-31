import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

/**
 * GET /api/analytics
 * Returns aggregated stats for the dashboard charts:
 *   - items_per_day     (last 30 days)
 *   - category_breakdown
 *   - priority_breakdown
 *   - source_breakdown   (top 10 sources / feeds)
 *   - feed_timeline      (items per feed per day, last 14 days)
 *   - totals             (overall counts)
 */
router.get('/', async (_req, res) => {
  try {
    // Run all queries in parallel
    const [
      itemsPerDayResult,
      categoryResult,
      priorityResult,
      sourceResult,
      feedTimelineResult,
      totalsResult,
    ] = await Promise.all([
      // Items created per day (last 30 days)
      pool.query(`
        SELECT
          DATE(created_at) AS date,
          COUNT(*)::int    AS count
        FROM items
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `),

      // Category breakdown from ai_insights
      pool.query(`
        SELECT
          COALESCE(category, 'unknown') AS category,
          COUNT(*)::int                  AS count
        FROM ai_insights
        GROUP BY category
        ORDER BY count DESC
      `),

      // Priority breakdown from ai_insights
      pool.query(`
        SELECT
          COALESCE(priority, 'low') AS priority,
          COUNT(*)::int              AS count
        FROM ai_insights
        GROUP BY priority
        ORDER BY count DESC
      `),

      // Top 10 sources (company / source field)
      pool.query(`
        SELECT
          COALESCE(source, company, 'unknown') AS source,
          COUNT(*)::int                         AS count
        FROM items
        WHERE source IS NOT NULL OR company IS NOT NULL
        GROUP BY COALESCE(source, company, 'unknown')
        ORDER BY count DESC
        LIMIT 10
      `),

      // Feed item timeline (last 14 days)
      pool.query(`
        SELECT
          f.name                       AS feed_name,
          DATE(i.created_at)           AS date,
          COUNT(*)::int                AS count
        FROM items i
        JOIN feeds f ON f.feed_id = i.feed_id
        WHERE i.created_at >= NOW() - INTERVAL '14 days'
        GROUP BY f.name, DATE(i.created_at)
        ORDER BY date, f.name
      `),

      // Overall totals
      pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM items)                                    AS total_items,
          (SELECT COUNT(*)::int FROM notices)                                  AS total_notices,
          (SELECT COUNT(*)::int FROM feeds WHERE active = TRUE)                AS active_feeds,
          (SELECT COUNT(*)::int FROM items WHERE created_at >= NOW() - INTERVAL '24 hours') AS items_last_24h,
          (SELECT COUNT(*)::int FROM items WHERE created_at >= NOW() - INTERVAL '7 days')   AS items_last_7d,
          (SELECT COUNT(*)::int FROM items WHERE feed_id IS NOT NULL)          AS feed_items,
          (SELECT COUNT(*)::int FROM items WHERE feed_id IS NULL)              AS manual_items
      `),
    ]);

    res.json({
      success: true,
      data: {
        items_per_day:      itemsPerDayResult.rows,
        category_breakdown: categoryResult.rows,
        priority_breakdown: priorityResult.rows,
        source_breakdown:   sourceResult.rows,
        feed_timeline:      feedTimelineResult.rows,
        totals:             totalsResult.rows[0],
      },
    });
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
