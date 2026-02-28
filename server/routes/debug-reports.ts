import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// Debug endpoint to test date queries
router.post('/debug/test-dates', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { startDate, endDate } = req.body;

    console.log('Received dates:', { startDate, endDate });

    const start = new Date(startDate);
    const end = new Date(endDate);

    console.log('Date objects:', { start, end });
    console.log('ISO strings:', {
      start: start.toISOString(),
      end: end.toISOString()
    });

    // Test simple query
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM voice_entries
       WHERE user_id = $1
         AND recorded_at >= $2::timestamp
         AND recorded_at <= $3::timestamp`,
      [userId, start.toISOString(), end.toISOString()]
    );

    res.json({
      message: 'Date query test successful',
      userId,
      dates: {
        startDate,
        endDate,
        startISO: start.toISOString(),
        endISO: end.toISOString()
      },
      result: result.rows[0]
    });
  } catch (error: any) {
    console.error('Debug test error:', error);
    res.status(500).json({
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    });
  }
});

export default router;
