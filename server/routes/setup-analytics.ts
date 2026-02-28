import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// Run Phase 7 analytics migration
router.post('/setup/analytics-migration', async (req: Request, res: Response) => {
  try {
    console.log('Running Phase 7 analytics migration...');

    // Analytics Cache Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_cache (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        metric_type VARCHAR(50) NOT NULL,
        time_period VARCHAR(50) NOT NULL,

        data JSONB NOT NULL,
        calculated_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,

        UNIQUE(user_id, metric_type, time_period)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_cache_user
      ON analytics_cache(user_id, metric_type)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires
      ON analytics_cache(expires_at)
    `);

    console.log('✅ Analytics cache table created');

    // User Insights Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_insights (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        insight_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,

        confidence_score DECIMAL(3, 2),
        priority INTEGER DEFAULT 0,

        metadata JSONB,

        status VARCHAR(50) DEFAULT 'new',
        viewed_at TIMESTAMP,
        acted_on_at TIMESTAMP,
        dismissed_at TIMESTAMP,

        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_insights_user
      ON user_insights(user_id, created_at DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_insights_status
      ON user_insights(user_id, status)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_insights_type
      ON user_insights(insight_type)
    `);

    console.log('✅ User insights table created');

    res.json({
      message: '✅ Phase 7: Analytics tables created successfully!',
      tables: ['analytics_cache', 'user_insights']
    });
  } catch (error: any) {
    console.error('❌ Analytics migration error:', error);
    res.status(500).json({
      error: 'Failed to run analytics migration',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
