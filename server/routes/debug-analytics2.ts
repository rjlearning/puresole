import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// Check voice_entries schema and data
router.get('/debug/analytics/inspect-voice-entries', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    // Get raw data without any casting
    const rawData = await pool.query(
      `SELECT
        id,
        mood_after,
        energy_level,
        stress_level,
        recorded_at,
        pg_typeof(mood_after) as mood_type,
        pg_typeof(energy_level) as energy_type,
        pg_typeof(stress_level) as stress_type
      FROM voice_entries
      WHERE user_id = $1
      LIMIT 5`,
      [userId]
    );

    // Try simple CASE without AVG
    const simpleCase = await pool.query(
      `SELECT
        mood_after,
        CASE mood_after
          WHEN 'great' THEN 5
          WHEN 'good' THEN 4
          WHEN 'okay' THEN 3
          WHEN 'bad' THEN 2
          WHEN 'terrible' THEN 1
          ELSE 3
        END as mood_numeric
      FROM voice_entries
      WHERE user_id = $1
      LIMIT 5`,
      [userId]
    );

    res.json({
      message: 'Voice entries inspection',
      rawData: rawData.rows,
      simpleCaseTest: simpleCase.rows
    });
  } catch (error: any) {
    console.error('Inspection error:', error);
    res.status(500).json({
      error: 'Inspection failed',
      details: error.message,
      hint: error.hint,
      position: error.position
    });
  }
});

// Try AVG with explicit casting
router.get('/debug/analytics/test-avg', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    // Test AVG on the CASE result
    const avgTest = await pool.query(
      `SELECT
        DATE(recorded_at) as date,
        AVG((CASE mood_after
          WHEN 'great' THEN 5
          WHEN 'good' THEN 4
          WHEN 'okay' THEN 3
          WHEN 'bad' THEN 2
          WHEN 'terrible' THEN 1
          ELSE 3
        END)::numeric) as avg_mood
      FROM voice_entries
      WHERE user_id = $1
      GROUP BY DATE(recorded_at)`,
      [userId]
    );

    res.json({
      message: 'AVG test successful',
      data: avgTest.rows
    });
  } catch (error: any) {
    console.error('AVG test error:', error);
    res.status(500).json({
      error: 'AVG test failed',
      details: error.message,
      hint: error.hint
    });
  }
});

export default router;
