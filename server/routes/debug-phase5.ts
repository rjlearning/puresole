import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Debug endpoint to check Phase 5 setup
router.get('/debug/phase5', async (req, res) => {
  const results: any = {
    tablesExist: {},
    dbConnection: false,
    sampleData: {},
    errors: []
  };

  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    results.dbConnection = true;

    // Check if Phase 5 tables exist
    const tables = ['wellness_plans', 'plan_items', 'user_goals', 'goal_progress', 'wellness_insights', 'recommendations'];

    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        results.tablesExist[table] = {
          exists: true,
          count: parseInt(result.rows[0].count)
        };
      } catch (error: any) {
        results.tablesExist[table] = {
          exists: false,
          error: error.message
        };
      }
    }

    // Check if user is authenticated
    results.isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : false;
    if (results.isAuthenticated) {
      results.userId = (req.user as any)?.id;
    }

    // Check if emotional_blueprints table exists (needed for plan generation)
    try {
      const result = await pool.query('SELECT COUNT(*) FROM emotional_blueprints');
      results.tablesExist.emotional_blueprints = {
        exists: true,
        count: parseInt(result.rows[0].count)
      };
    } catch (error: any) {
      results.tablesExist.emotional_blueprints = {
        exists: false,
        error: error.message
      };
    }

    // Check if wellness_activities table exists
    try {
      const result = await pool.query('SELECT COUNT(*) FROM wellness_activities');
      results.tablesExist.wellness_activities = {
        exists: true,
        count: parseInt(result.rows[0].count)
      };
    } catch (error: any) {
      results.tablesExist.wellness_activities = {
        exists: false,
        error: error.message
      };
    }

    res.json({
      message: 'Phase 5 Debug Info',
      status: 'success',
      ...results
    });
  } catch (error: any) {
    results.errors.push(error.message);
    res.status(500).json({
      message: 'Debug check failed',
      status: 'error',
      ...results
    });
  }
});

export default router;
