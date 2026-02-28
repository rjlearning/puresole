import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// Test each column individually
router.get('/debug/analytics/test-columns', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const results: any = {};

    // Test mood_after alone
    try {
      const mood = await pool.query(
        'SELECT mood_after FROM voice_entries WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      results.mood_after = { success: true, sample: mood.rows[0] };
    } catch (e: any) {
      results.mood_after = { success: false, error: e.message };
    }

    // Test energy_level alone
    try {
      const energy = await pool.query(
        'SELECT energy_level FROM voice_entries WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      results.energy_level = { success: true, sample: energy.rows[0] };
    } catch (e: any) {
      results.energy_level = { success: false, error: e.message };
    }

    // Test stress_level alone
    try {
      const stress = await pool.query(
        'SELECT stress_level FROM voice_entries WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      results.stress_level = { success: true, sample: stress.rows[0] };
    } catch (e: any) {
      results.stress_level = { success: false, error: e.message };
    }

    // Test all columns without type checking
    try {
      const all = await pool.query(
        'SELECT id, recorded_at FROM voice_entries WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      results.basic_columns = { success: true, sample: all.rows[0] };
    } catch (e: any) {
      results.basic_columns = { success: false, error: e.message };
    }

    res.json({
      message: 'Column-by-column test',
      results
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Test failed',
      details: error.message
    });
  }
});

// Get table schema
router.get('/debug/analytics/schema', async (req: Request, res: Response) => {
  try {
    const schema = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'voice_entries'
      ORDER BY ordinal_position
    `);

    res.json({
      message: 'voice_entries schema',
      columns: schema.rows
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Schema check failed',
      details: error.message
    });
  }
});

export default router;
