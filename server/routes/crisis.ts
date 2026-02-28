import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// ============================================
// CRISIS RESOURCES
// ============================================

// GET /api/crisis/resources - Get crisis resources by country
router.get('/crisis/resources', async (req: Request, res: Response) => {
  try {
    const { country = 'US' } = req.query;

    const result = await pool.query(
      `SELECT id, country_code, region, resource_type, name, description,
              phone, sms_number, website_url, chat_url, available_24_7, languages
       FROM crisis_resources
       WHERE country_code = $1 AND is_active = true
       ORDER BY display_order ASC, name ASC`,
      [country]
    );

    res.json({
      message: 'Crisis resources retrieved',
      resources: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching crisis resources:', error);
    res.status(500).json({ error: 'Failed to fetch crisis resources' });
  }
});

// GET /api/crisis/resources/all-countries - Get available countries
router.get('/crisis/resources/all-countries', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT country_code,
              COUNT(*) as resource_count
       FROM crisis_resources
       WHERE is_active = true
       GROUP BY country_code
       ORDER BY country_code ASC`
    );

    res.json({
      message: 'Available countries retrieved',
      countries: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// ============================================
// SAFETY PLANS
// ============================================

// GET /api/crisis/safety-plan - Get user's safety plan
router.get('/crisis/safety-plan', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    const result = await pool.query(
      `SELECT * FROM safety_plans WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        message: 'No safety plan found',
        safetyPlan: null
      });
    }

    res.json({
      message: 'Safety plan retrieved',
      safetyPlan: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching safety plan:', error);
    res.status(500).json({ error: 'Failed to fetch safety plan' });
  }
});

// POST /api/crisis/safety-plan - Create or update safety plan
router.post('/crisis/safety-plan', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const {
      warning_signs,
      coping_strategies,
      distraction_activities,
      support_contacts,
      professional_contacts,
      safe_environment_steps,
      reasons_to_live
    } = req.body;

    // Check if user already has a safety plan
    const existing = await pool.query(
      `SELECT id FROM safety_plans WHERE user_id = $1`,
      [userId]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing plan
      result = await pool.query(
        `UPDATE safety_plans SET
          warning_signs = $2,
          coping_strategies = $3,
          distraction_activities = $4,
          support_contacts = $5,
          professional_contacts = $6,
          safe_environment_steps = $7,
          reasons_to_live = $8,
          updated_at = NOW()
         WHERE user_id = $1
         RETURNING *`,
        [
          userId,
          JSON.stringify(warning_signs || []),
          JSON.stringify(coping_strategies || []),
          JSON.stringify(distraction_activities || []),
          JSON.stringify(support_contacts || []),
          JSON.stringify(professional_contacts || []),
          JSON.stringify(safe_environment_steps || []),
          JSON.stringify(reasons_to_live || [])
        ]
      );
    } else {
      // Create new plan
      result = await pool.query(
        `INSERT INTO safety_plans (
          user_id, warning_signs, coping_strategies, distraction_activities,
          support_contacts, professional_contacts, safe_environment_steps, reasons_to_live
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          userId,
          JSON.stringify(warning_signs || []),
          JSON.stringify(coping_strategies || []),
          JSON.stringify(distraction_activities || []),
          JSON.stringify(support_contacts || []),
          JSON.stringify(professional_contacts || []),
          JSON.stringify(safe_environment_steps || []),
          JSON.stringify(reasons_to_live || [])
        ]
      );
    }

    res.json({
      message: 'Safety plan saved successfully',
      safetyPlan: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error saving safety plan:', error);
    res.status(500).json({ error: 'Failed to save safety plan' });
  }
});

// DELETE /api/crisis/safety-plan - Delete user's safety plan
router.delete('/crisis/safety-plan', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    await pool.query(
      `DELETE FROM safety_plans WHERE user_id = $1`,
      [userId]
    );

    res.json({
      message: 'Safety plan deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting safety plan:', error);
    res.status(500).json({ error: 'Failed to delete safety plan' });
  }
});

export default router;
