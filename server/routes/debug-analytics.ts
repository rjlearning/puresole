import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// Test mood query
router.get('/debug/analytics/test-mood', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    console.log('Testing mood query for user:', userId);

    // Test query with explicit numeric casting
    const result = await pool.query(
      `SELECT
        DATE(recorded_at) as date,
        mood_after,
        energy_level,
        stress_level,
        CASE mood_after
          WHEN 'great' THEN 5::numeric
          WHEN 'good' THEN 4::numeric
          WHEN 'okay' THEN 3::numeric
          WHEN 'bad' THEN 2::numeric
          WHEN 'terrible' THEN 1::numeric
          ELSE 3::numeric
        END as mood_numeric
      FROM voice_entries
      WHERE user_id = $1 AND recorded_at >= $2::timestamp
      LIMIT 10`,
      [userId, startDate.toISOString()]
    );

    res.json({
      message: 'Test query successful',
      rowCount: result.rows.length,
      sampleData: result.rows,
      query: 'SELECT with CASE mood_after WHEN...'
    });
  } catch (error: any) {
    console.error('Test query error:', error);
    res.status(500).json({
      error: 'Test query failed',
      details: error.message,
      stack: error.stack
    });
  }
});

// Test activities query
router.get('/debug/analytics/test-activities', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const result = await pool.query(
      `SELECT
        DATE(uac.completed_at) as date,
        wa.category,
        wa.name,
        COUNT(*) as activity_count
      FROM user_activity_completions uac
      JOIN wellness_activities wa ON uac.activity_id = wa.id
      WHERE uac.user_id = $1 AND uac.completed_at >= $2::timestamp
      GROUP BY DATE(uac.completed_at), wa.category, wa.name
      LIMIT 10`,
      [userId, startDate.toISOString()]
    );

    res.json({
      message: 'Activities query successful',
      rowCount: result.rows.length,
      sampleData: result.rows
    });
  } catch (error: any) {
    console.error('Activities test error:', error);
    res.status(500).json({
      error: 'Activities test failed',
      details: error.message
    });
  }
});

// Check voice entries data
router.get('/debug/analytics/check-data', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    const voiceCount = await pool.query(
      'SELECT COUNT(*) as count FROM voice_entries WHERE user_id = $1',
      [userId]
    );

    const activityCount = await pool.query(
      'SELECT COUNT(*) as count FROM user_activity_completions WHERE user_id = $1',
      [userId]
    );

    const moodSample = await pool.query(
      'SELECT mood_after, COUNT(*) as count FROM voice_entries WHERE user_id = $1 GROUP BY mood_after',
      [userId]
    );

    res.json({
      voiceEntries: voiceCount.rows[0].count,
      activityCompletions: activityCount.rows[0].count,
      moodDistribution: moodSample.rows
    });
  } catch (error: any) {
    console.error('Data check error:', error);
    res.status(500).json({
      error: 'Data check failed',
      details: error.message
    });
  }
});

export default router;
