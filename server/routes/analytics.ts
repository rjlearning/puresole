import { Router, Request, Response } from 'express';
import {
  calculateMoodTrends,
  findCorrelations,
  predictMood,
  generateInsights,
  generateRecommendations,
  getCachedAnalytics,
  setCachedAnalytics,
  saveInsight
} from '../services/analyticsCalculation';
import { pool } from '../db';

const router = Router();

// ============================================
// MOOD TRENDS
// ============================================

// GET /api/analytics/trends - Get mood trends over time
router.get('/analytics/trends', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { period = 'month' } = req.query;

    // Check cache first
    const cached = await getCachedAnalytics(userId, 'mood_trend', period as string);
    if (cached) {
      return res.json({
        message: 'Mood trends retrieved (cached)',
        data: cached,
        cached: true
      });
    }

    // Calculate fresh data
    const trends = await calculateMoodTrends(
      userId,
      period as 'week' | 'month' | 'quarter' | 'year'
    );

    // Cache for 6 hours
    await setCachedAnalytics(userId, 'mood_trend', period as string, trends, 6);

    res.json({
      message: 'Mood trends calculated',
      data: trends,
      cached: false
    });
  } catch (error: any) {
    console.error('Error calculating mood trends:', error);
    res.status(500).json({
      error: 'Failed to calculate mood trends',
      details: error.message
    });
  }
});

// ============================================
// CORRELATIONS
// ============================================

// GET /api/analytics/correlations - Find activity-mood correlations
router.get('/analytics/correlations', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { period = 'month' } = req.query;

    // Check cache
    const cached = await getCachedAnalytics(userId, 'correlation', period as string);
    if (cached) {
      return res.json({
        message: 'Correlations retrieved (cached)',
        data: cached,
        cached: true
      });
    }

    // Calculate correlations
    const correlations = await findCorrelations(
      userId,
      period as 'month' | 'quarter'
    );

    // Cache for 12 hours
    await setCachedAnalytics(userId, 'correlation', period as string, correlations, 12);

    res.json({
      message: 'Correlations calculated',
      data: correlations,
      cached: false
    });
  } catch (error: any) {
    console.error('Error calculating correlations:', error);
    res.status(500).json({
      error: 'Failed to calculate correlations',
      details: error.message
    });
  }
});

// ============================================
// PREDICTIONS
// ============================================

// GET /api/analytics/predictions - Get mood predictions
router.get('/analytics/predictions', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { days = 7 } = req.query;

    // Check cache
    const cached = await getCachedAnalytics(userId, 'prediction', `${days}days`);
    if (cached) {
      return res.json({
        message: 'Predictions retrieved (cached)',
        data: cached,
        cached: true
      });
    }

    // Generate predictions
    const predictions = await predictMood(userId, parseInt(days as string));

    // Cache for 24 hours
    await setCachedAnalytics(userId, 'prediction', `${days}days`, predictions, 24);

    res.json({
      message: 'Mood predictions generated',
      data: predictions,
      cached: false
    });
  } catch (error: any) {
    console.error('Error generating predictions:', error);
    res.status(500).json({
      error: 'Failed to generate predictions',
      details: error.message
    });
  }
});

// ============================================
// INSIGHTS
// ============================================

// GET /api/analytics/insights - Get personalized insights
router.get('/analytics/insights', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { status = 'new', limit = 10 } = req.query;

    // Get saved insights from database
    let query = `
      SELECT * FROM user_insights
      WHERE user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY priority DESC, created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const savedInsights = await pool.query(query, params);

    // If no new insights or requesting fresh ones, generate new insights
    if (savedInsights.rows.length === 0 || status === 'all') {
      const freshInsights = await generateInsights(userId);

      // Save new insights to database
      for (const insight of freshInsights) {
        await saveInsight(userId, insight);
      }

      // Re-fetch from database
      const updatedResult = await pool.query(
        `SELECT * FROM user_insights
         WHERE user_id = $1 AND status = 'new'
         ORDER BY priority DESC, created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return res.json({
        message: 'Fresh insights generated',
        insights: updatedResult.rows,
        generated: true
      });
    }

    res.json({
      message: 'Insights retrieved',
      insights: savedInsights.rows,
      generated: false
    });
  } catch (error: any) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      error: 'Failed to fetch insights',
      details: error.message
    });
  }
});

// POST /api/analytics/insights/refresh - Force refresh insights
router.post('/analytics/insights/refresh', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    // Generate fresh insights
    const insights = await generateInsights(userId);

    // Save to database
    const savedIds = [];
    for (const insight of insights) {
      const id = await saveInsight(userId, insight);
      savedIds.push(id);
    }

    // Fetch saved insights
    const result = await pool.query(
      `SELECT * FROM user_insights
       WHERE id = ANY($1)
       ORDER BY priority DESC`,
      [savedIds]
    );

    res.json({
      message: 'Insights refreshed',
      insights: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error refreshing insights:', error);
    res.status(500).json({
      error: 'Failed to refresh insights',
      details: error.message
    });
  }
});

// POST /api/analytics/insights/:id/viewed - Mark insight as viewed
router.post('/analytics/insights/:id/viewed', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE user_insights
       SET status = 'viewed',
           viewed_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    res.json({
      message: 'Insight marked as viewed',
      insight: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error marking insight as viewed:', error);
    res.status(500).json({ error: 'Failed to update insight' });
  }
});

// POST /api/analytics/insights/:id/dismiss - Dismiss an insight
router.post('/analytics/insights/:id/dismiss', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE user_insights
       SET status = 'dismissed',
           dismissed_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    res.json({
      message: 'Insight dismissed',
      insight: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error dismissing insight:', error);
    res.status(500).json({ error: 'Failed to dismiss insight' });
  }
});

// ============================================
// RECOMMENDATIONS
// ============================================

// GET /api/analytics/recommendations - Get personalized recommendations
router.get('/analytics/recommendations', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    // Check cache
    const cached = await getCachedAnalytics(userId, 'recommendations', 'current');
    if (cached) {
      return res.json({
        message: 'Recommendations retrieved (cached)',
        recommendations: cached,
        cached: true
      });
    }

    // Generate recommendations
    const recommendations = await generateRecommendations(userId);

    // Cache for 12 hours
    await setCachedAnalytics(userId, 'recommendations', 'current', recommendations, 12);

    res.json({
      message: 'Recommendations generated',
      recommendations,
      cached: false
    });
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      details: error.message
    });
  }
});

// ============================================
// ANALYTICS DASHBOARD SUMMARY
// ============================================

// GET /api/analytics/dashboard - Get complete dashboard data
router.get('/analytics/dashboard', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    // Fetch all analytics in parallel
    const [trends, correlations, predictions, insights, recommendations] = await Promise.all([
      calculateMoodTrends(userId, 'month'),
      findCorrelations(userId, 'month'),
      predictMood(userId, 7),
      pool.query(
        `SELECT * FROM user_insights
         WHERE user_id = $1 AND status = 'new'
         ORDER BY priority DESC
         LIMIT 5`,
        [userId]
      ),
      generateRecommendations(userId)
    ]);

    res.json({
      message: 'Dashboard data retrieved',
      dashboard: {
        trends,
        correlations,
        predictions,
        insights: insights.rows,
        recommendations
      }
    });
  } catch (error: any) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      details: error.message
    });
  }
});

export default router;
