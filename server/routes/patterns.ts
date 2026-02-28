import { Router, Request, Response } from 'express';
import {
  analyzeDayOfWeekPatterns,
  analyzeTimeOfDayPatterns,
  analyzeActivityStreaks
} from '../services/patternDetection';

const router = Router();

// GET /api/patterns/day-of-week
router.get('/patterns/day-of-week', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const patterns = await analyzeDayOfWeekPatterns(userId);

    res.json({
      message: 'Day of week patterns analyzed',
      patterns
    });
  } catch (error: any) {
    console.error('Error analyzing day patterns:', error);
    res.status(500).json({
      error: 'Failed to analyze day patterns',
      details: error.message
    });
  }
});

// GET /api/patterns/time-of-day
router.get('/patterns/time-of-day', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const patterns = await analyzeTimeOfDayPatterns(userId);

    res.json({
      message: 'Time of day patterns analyzed',
      patterns
    });
  } catch (error: any) {
    console.error('Error analyzing time patterns:', error);
    res.status(500).json({
      error: 'Failed to analyze time patterns',
      details: error.message
    });
  }
});

// GET /api/patterns/streaks
router.get('/patterns/streaks', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const streaks = await analyzeActivityStreaks(userId);

    res.json({
      message: 'Activity streaks calculated',
      streaks
    });
  } catch (error: any) {
    console.error('Error calculating streaks:', error);
    res.status(500).json({
      error: 'Failed to calculate streaks',
      details: error.message
    });
  }
});

export default router;
