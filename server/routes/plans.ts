import { Router } from 'express';
import { pool } from '../db';
import { generateDailyPlan, savePlanToDatabase } from '../services/planGeneration';

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// ============================================
// WELLNESS PLANS ROUTES
// ============================================

// GET /api/plans - Get all plans for current user
router.get('/plans', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { status, type, date } = req.query;

    let query = `
      SELECT p.*,
             COUNT(pi.id) as total_items,
             COUNT(pi.id) FILTER (WHERE pi.status = 'completed') as completed_items
      FROM wellness_plans p
      LEFT JOIN plan_items pi ON p.id = pi.plan_id
      WHERE p.user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }

    if (type) {
      query += ` AND p.plan_type = $${paramIndex++}`;
      params.push(type);
    }

    if (date) {
      query += ` AND p.target_date = $${paramIndex++}`;
      params.push(date);
    }

    query += ` GROUP BY p.id ORDER BY p.target_date DESC, p.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({ plans: result.rows });
  } catch (error: any) {
    console.error('[Plans API] Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// GET /api/plans/today - Get today's plan
router.get('/plans/today', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;

    const result = await pool.query(
      `SELECT p.*,
              json_agg(
                json_build_object(
                  'id', pi.id,
                  'title', pi.title,
                  'description', pi.description,
                  'item_type', pi.item_type,
                  'activity_id', pi.activity_id,
                  'scheduled_time', pi.scheduled_time,
                  'estimated_duration', pi.estimated_duration,
                  'status', pi.status,
                  'display_order', pi.display_order,
                  'completed_at', pi.completed_at
                ) ORDER BY pi.display_order
              ) as items
       FROM wellness_plans p
       LEFT JOIN plan_items pi ON p.id = pi.plan_id
       WHERE p.user_id = $1
         AND DATE(p.target_date) = CURRENT_DATE
         AND p.status = 'active'
       GROUP BY p.id
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ plan: null });
    }

    res.json({ plan: result.rows[0] });
  } catch (error: any) {
    console.error('[Plans API] Error fetching today\'s plan:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s plan' });
  }
});

// GET /api/plans/:id - Get specific plan with items
router.get('/plans/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*,
              json_agg(
                json_build_object(
                  'id', pi.id,
                  'title', pi.title,
                  'description', pi.description,
                  'item_type', pi.item_type,
                  'activity_id', pi.activity_id,
                  'scheduled_time', pi.scheduled_time,
                  'estimated_duration', pi.estimated_duration,
                  'status', pi.status,
                  'display_order', pi.display_order,
                  'completed_at', pi.completed_at,
                  'effectiveness_rating', pi.effectiveness_rating,
                  'notes', pi.notes
                ) ORDER BY pi.display_order
              ) as items
       FROM wellness_plans p
       LEFT JOIN plan_items pi ON p.id = pi.plan_id
       WHERE p.id = $1 AND p.user_id = $2
       GROUP BY p.id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ plan: result.rows[0] });
  } catch (error: any) {
    console.error('[Plans API] Error fetching plan:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

// POST /api/plans/generate - Generate new AI plan
router.post('/plans/generate', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { date, focus } = req.body;

    const targetDate = date ? new Date(date + 'T12:00:00') : new Date();

    console.log(`[Plans API] Generating plan for user ${userId}, date: ${targetDate.toDateString()}`);

    // Check if plan already exists for this date
    const existingResult = await pool.query(
      `SELECT id FROM wellness_plans
       WHERE user_id = $1 AND DATE(target_date) = DATE($2) AND status = 'active'`,
      [userId, targetDate]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        error: 'Plan already exists for this date',
        existingPlanId: existingResult.rows[0].id
      });
    }

    // Generate plan
    const generatedPlan = await generateDailyPlan(userId, targetDate, focus);

    // Save to database
    const planId = await savePlanToDatabase(userId, generatedPlan, targetDate);

    // Fetch the saved plan with items
    const result = await pool.query(
      `SELECT p.*,
              json_agg(
                json_build_object(
                  'id', pi.id,
                  'title', pi.title,
                  'description', pi.description,
                  'item_type', pi.item_type,
                  'activity_id', pi.activity_id,
                  'scheduled_time', pi.scheduled_time,
                  'estimated_duration', pi.estimated_duration,
                  'status', pi.status,
                  'display_order', pi.display_order
                ) ORDER BY pi.display_order
              ) as items
       FROM wellness_plans p
       LEFT JOIN plan_items pi ON p.id = pi.plan_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [planId]
    );

    res.json({
      message: 'Plan generated successfully',
      plan: result.rows[0]
    });
  } catch (error: any) {
    console.error('[Plans API] Error generating plan:', error);
    res.status(500).json({ error: 'Failed to generate plan' });
  }
});

// PUT /api/plans/:id/items/:itemId - Update plan item
router.put('/plans/:id/items/:itemId', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id, itemId } = req.params;
    const { status, effectiveness_rating, notes } = req.body;

    // Verify plan belongs to user
    const planCheck = await pool.query(
      'SELECT id FROM wellness_plans WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);

      if (status === 'completed') {
        updates.push(`completed_at = NOW()`);
      }
    }

    if (effectiveness_rating !== undefined) {
      updates.push(`effectiveness_rating = $${paramIndex++}`);
      values.push(effectiveness_rating);
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(itemId);

    const result = await pool.query(
      `UPDATE plan_items
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan item not found' });
    }

    // If completing an activity, also record in user_activity_completions
    if (status === 'completed' && result.rows[0].activity_id) {
      await pool.query(
        `INSERT INTO user_activity_completions (
          user_id, activity_id, completed_at, duration_actual, effectiveness_rating, notes
        ) VALUES ($1, $2, NOW(), $3, $4, $5)`,
        [userId, result.rows[0].activity_id, result.rows[0].estimated_duration, effectiveness_rating || null, notes || null]
      );

      // Update user stats
      await pool.query(
        `INSERT INTO user_stats (user_id, total_activities, total_points)
         VALUES ($1, 1, 10)
         ON CONFLICT (user_id)
         DO UPDATE SET
           total_activities = user_stats.total_activities + 1,
           total_points = user_stats.total_points + 10`,
        [userId]
      );
    }

    res.json({
      message: 'Plan item updated successfully',
      item: result.rows[0]
    });
  } catch (error: any) {
    console.error('[Plans API] Error updating plan item:', error);
    res.status(500).json({ error: 'Failed to update plan item' });
  }
});

// DELETE /api/plans/:id - Archive/delete plan
router.delete('/plans/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE wellness_plans
       SET status = 'archived', updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ message: 'Plan archived successfully' });
  } catch (error: any) {
    console.error('[Plans API] Error archiving plan:', error);
    res.status(500).json({ error: 'Failed to archive plan' });
  }
});

// GET /api/plans/:id/stats - Get plan completion stats
router.get('/plans/:id/stats', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { id } = req.params;

    // Verify plan belongs to user
    const planCheck = await pool.query(
      'SELECT id FROM wellness_plans WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const result = await pool.query(
      `SELECT
         COUNT(*) as total_items,
         COUNT(*) FILTER (WHERE status = 'completed') as completed_items,
         COUNT(*) FILTER (WHERE status = 'skipped') as skipped_items,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_items,
         AVG(effectiveness_rating) FILTER (WHERE effectiveness_rating IS NOT NULL) as avg_effectiveness,
         SUM(estimated_duration) as total_estimated_minutes,
         SUM(estimated_duration) FILTER (WHERE status = 'completed') as completed_minutes
       FROM plan_items
       WHERE plan_id = $1`,
      [id]
    );

    res.json({ stats: result.rows[0] });
  } catch (error: any) {
    console.error('[Plans API] Error fetching plan stats:', error);
    res.status(500).json({ error: 'Failed to fetch plan stats' });
  }
});

export default router;
