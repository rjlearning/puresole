import { Router } from 'express';
import { pool } from '../db';

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// ============================================
// GOALS ROUTES
// ============================================

// GET /api/goals - Get all user goals
router.get('/goals', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { status, category } = req.query;

    let query = 'SELECT * FROM user_goals WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    query += ' ORDER BY CASE WHEN status = \'active\' THEN 0 ELSE 1 END, target_date ASC';

    const result = await pool.query(query, params);

    res.json({ goals: result.rows });
  } catch (error: any) {
    console.error('[Goals API] Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// GET /api/goals/:id - Get specific goal with progress history
router.get('/goals/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;

    const goalResult = await pool.query(
      'SELECT * FROM user_goals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goalResult.rows[0];

    // Get progress history
    const progressResult = await pool.query(
      `SELECT * FROM goal_progress
       WHERE goal_id = $1
       ORDER BY recorded_at DESC
       LIMIT 50`,
      [id]
    );

    res.json({
      goal,
      progress: progressResult.rows
    });
  } catch (error: any) {
    console.error('[Goals API] Error fetching goal:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// POST /api/goals - Create new goal
router.post('/goals', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const {
      title,
      description,
      goal_type,
      category,
      target_metric,
      target_value,
      unit,
      target_date,
      why_important,
      reward
    } = req.body;

    if (!title || !goal_type || !target_date) {
      return res.status(400).json({
        error: 'Missing required fields: title, goal_type, target_date'
      });
    }

    const result = await pool.query(
      `INSERT INTO user_goals (
        user_id, title, description, goal_type, category,
        target_metric, target_value, unit, start_date, target_date,
        why_important, reward
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, $9, $10, $11)
      RETURNING *`,
      [
        userId,
        title,
        description || null,
        goal_type,
        category || null,
        target_metric || null,
        target_value || null,
        unit || null,
        target_date,
        why_important || null,
        reward || null
      ]
    );

    res.status(201).json({
      message: 'Goal created successfully',
      goal: result.rows[0]
    });
  } catch (error: any) {
    console.error('[Goals API] Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PUT /api/goals/:id - Update goal
router.put('/goals/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;
    const {
      title,
      description,
      status,
      current_value,
      target_value,
      category,
      target_date,
      why_important,
      reward
    } = req.body;

    // Verify goal belongs to user
    const checkResult = await pool.query(
      'SELECT id FROM user_goals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);

      if (status === 'completed') {
        updates.push(`completed_at = NOW()`);
        updates.push(`completion_percentage = 100`);
      }
    }

    if (current_value !== undefined) {
      updates.push(`current_value = $${paramIndex++}`);
      values.push(current_value);
    }

    if (target_value !== undefined) {
      updates.push(`target_value = $${paramIndex++}`);
      values.push(target_value);
    }

    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category);
    }

    if (target_date !== undefined) {
      updates.push(`target_date = $${paramIndex++}`);
      values.push(target_date);
    }

    if (why_important !== undefined) {
      updates.push(`why_important = $${paramIndex++}`);
      values.push(why_important);
    }

    if (reward !== undefined) {
      updates.push(`reward = $${paramIndex++}`);
      values.push(reward);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE user_goals
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    res.json({
      message: 'Goal updated successfully',
      goal: result.rows[0]
    });
  } catch (error: any) {
    console.error('[Goals API] Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// POST /api/goals/:id/progress - Record progress snapshot
router.post('/goals/:id/progress', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;
    const { value, note, mood_at_recording } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Verify goal belongs to user and get target_value
    const goalResult = await pool.query(
      'SELECT id, target_value, current_value FROM user_goals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goalResult.rows[0];

    // Calculate percentage
    const percentage = goal.target_value > 0
      ? Math.min((value / goal.target_value) * 100, 100)
      : null;

    // Insert progress record
    const progressResult = await pool.query(
      `INSERT INTO goal_progress (goal_id, value, percentage, note, mood_at_recording)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, value, percentage, note || null, mood_at_recording || null]
    );

    // Update current_value in goal
    await pool.query(
      'UPDATE user_goals SET current_value = $1 WHERE id = $2',
      [value, id]
    );

    res.status(201).json({
      message: 'Progress recorded successfully',
      progress: progressResult.rows[0]
    });
  } catch (error: any) {
    console.error('[Goals API] Error recording progress:', error);
    res.status(500).json({ error: 'Failed to record progress' });
  }
});

// DELETE /api/goals/:id - Delete goal
router.delete('/goals/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM user_goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (error: any) {
    console.error('[Goals API] Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// GET /api/goals/:id/suggestions - Get AI suggestions for goal
router.get('/goals/:id/suggestions', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;

    // Verify goal belongs to user
    const goalResult = await pool.query(
      'SELECT * FROM user_goals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goalResult.rows[0];

    // Simple rule-based suggestions (can be enhanced with AI later)
    const suggestions = [];

    if (goal.category === 'mental_health' || goal.target_metric === 'activities_completed') {
      suggestions.push({
        type: 'activity',
        title: 'Complete a daily mindfulness activity',
        description: 'Try meditation, journaling, or breathing exercises',
        reason: 'Regular practice helps build momentum toward your goal'
      });
    }

    if (goal.category === 'mindfulness') {
      suggestions.push({
        type: 'habit',
        title: 'Set a daily meditation reminder',
        description: 'Schedule 10 minutes each morning for meditation',
        reason: 'Consistency is key to building a mindfulness practice'
      });
    }

    if (goal.completion_percentage < 25) {
      suggestions.push({
        type: 'motivation',
        title: 'Break it into smaller milestones',
        description: 'Set weekly mini-goals to track progress',
        reason: 'Smaller wins keep you motivated on the journey'
      });
    }

    if (goal.completion_percentage > 75) {
      suggestions.push({
        type: 'encouragement',
        title: 'You\'re almost there!',
        description: 'Celebrate how far you\'ve come and keep going',
        reason: 'You\'re in the home stretch - finish strong!'
      });
    }

    res.json({ suggestions });
  } catch (error: any) {
    console.error('[Goals API] Error getting suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// GET /api/goals/stats/summary - Get user's goals summary stats
router.get('/goals/stats/summary', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;

    const result = await pool.query(
      `SELECT
         COUNT(*) as total_goals,
         COUNT(*) FILTER (WHERE status = 'active') as active_goals,
         COUNT(*) FILTER (WHERE status = 'completed') as completed_goals,
         COUNT(*) FILTER (WHERE status = 'abandoned') as abandoned_goals,
         AVG(completion_percentage) FILTER (WHERE status = 'active') as avg_completion,
         COUNT(*) FILTER (WHERE status = 'active' AND target_date < CURRENT_DATE) as overdue_goals
       FROM user_goals
       WHERE user_id = $1`,
      [userId]
    );

    res.json({ stats: result.rows[0] });
  } catch (error: any) {
    console.error('[Goals API] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
