import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// ============================================
// MEDICATIONS
// ============================================

// GET /api/medications - Get all medications for user
router.get('/medications', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { activeOnly } = req.query;

    let query = 'SELECT * FROM medications WHERE user_id = $1';
    const params: any[] = [userId];

    if (activeOnly === 'true') {
      query += ' AND is_active = true';
    }

    query += ' ORDER BY is_active DESC, start_date DESC';

    const result = await pool.query(query, params);

    res.json({ medications: result.rows });
  } catch (error: any) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

// GET /api/medications/:id - Get single medication with details
router.get('/medications/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;

    const medicationResult = await pool.query(
      'SELECT * FROM medications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (medicationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    // Get recent logs
    const logsResult = await pool.query(
      `SELECT * FROM medication_logs
       WHERE medication_id = $1
       ORDER BY taken_at DESC
       LIMIT 30`,
      [id]
    );

    // Get side effects
    const sideEffectsResult = await pool.query(
      `SELECT * FROM medication_side_effects
       WHERE medication_id = $1
       ORDER BY occurred_at DESC
       LIMIT 20`,
      [id]
    );

    // Get reminders
    const remindersResult = await pool.query(
      'SELECT * FROM medication_reminders WHERE medication_id = $1',
      [id]
    );

    // Get effectiveness assessments
    const effectivenessResult = await pool.query(
      `SELECT * FROM medication_effectiveness
       WHERE medication_id = $1
       ORDER BY assessment_date DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      medication: medicationResult.rows[0],
      recentLogs: logsResult.rows,
      sideEffects: sideEffectsResult.rows,
      reminders: remindersResult.rows,
      effectivenessAssessments: effectivenessResult.rows
    });
  } catch (error: any) {
    console.error('Error fetching medication details:', error);
    res.status(500).json({ error: 'Failed to fetch medication details' });
  }
});

// POST /api/medications - Create new medication
router.post('/medications', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const {
      name,
      dosage,
      frequency,
      prescribedBy,
      prescriptionDate,
      startDate,
      endDate,
      reason,
      instructions,
      totalQuantity,
      notes
    } = req.body;

    if (!name || !startDate) {
      return res.status(400).json({ error: 'Name and start date are required' });
    }

    const result = await pool.query(
      `INSERT INTO medications
       (user_id, name, dosage, frequency, prescribed_by, prescription_date,
        start_date, end_date, reason, instructions, total_quantity, remaining_quantity, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [userId, name, dosage, frequency, prescribedBy, prescriptionDate,
       startDate, endDate, reason, instructions, totalQuantity, totalQuantity, notes]
    );

    res.json({
      message: 'Medication added',
      medication: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating medication:', error);
    res.status(500).json({ error: 'Failed to create medication' });
  }
});

// PUT /api/medications/:id - Update medication
router.put('/medications/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;
    const {
      name,
      dosage,
      frequency,
      prescribedBy,
      endDate,
      isActive,
      instructions,
      notes
    } = req.body;

    const result = await pool.query(
      `UPDATE medications
       SET name = COALESCE($3, name),
           dosage = COALESCE($4, dosage),
           frequency = COALESCE($5, frequency),
           prescribed_by = COALESCE($6, prescribed_by),
           end_date = COALESCE($7, end_date),
           is_active = COALESCE($8, is_active),
           instructions = COALESCE($9, instructions),
           notes = COALESCE($10, notes),
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId, name, dosage, frequency, prescribedBy, endDate, isActive, instructions, notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    res.json({
      message: 'Medication updated',
      medication: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating medication:', error);
    res.status(500).json({ error: 'Failed to update medication' });
  }
});

// DELETE /api/medications/:id - Delete medication
router.delete('/medications/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM medications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    res.json({ message: 'Medication deleted' });
  } catch (error: any) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ error: 'Failed to delete medication' });
  }
});

// ============================================
// MEDICATION LOGS
// ============================================

// GET /api/medications/:id/logs - Get logs for a medication
router.get('/medications/:id/logs', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Verify ownership
    const medicationCheck = await pool.query(
      'SELECT id FROM medications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (medicationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    let query = 'SELECT * FROM medication_logs WHERE medication_id = $1';
    const params: any[] = [id];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND taken_at >= $${paramCount}::timestamp`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND taken_at <= $${paramCount}::timestamp`;
      params.push(endDate);
    }

    query += ' ORDER BY taken_at DESC LIMIT 100';

    const result = await pool.query(query, params);

    res.json({ logs: result.rows });
  } catch (error: any) {
    console.error('Error fetching medication logs:', error);
    res.status(500).json({ error: 'Failed to fetch medication logs' });
  }
});

// POST /api/medications/:id/logs - Log medication dose
router.post('/medications/:id/logs', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;
    const {
      takenAt,
      dosageTaken,
      wasTaken,
      skipReason,
      notes,
      moodBefore,
      moodAfter,
      sideEffectsExperienced
    } = req.body;

    // Verify ownership
    const medicationCheck = await pool.query(
      'SELECT id FROM medications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (medicationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    const result = await pool.query(
      `INSERT INTO medication_logs
       (medication_id, taken_at, dosage_taken, was_taken, skip_reason, notes,
        mood_before, mood_after, side_effects_experienced)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, takenAt || new Date(), dosageTaken, wasTaken !== false, skipReason,
       notes, moodBefore, moodAfter, sideEffectsExperienced]
    );

    res.json({
      message: 'Medication logged',
      log: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error logging medication:', error);
    res.status(500).json({ error: 'Failed to log medication' });
  }
});

// ============================================
// SIDE EFFECTS
// ============================================

// POST /api/medications/:id/side-effects - Report side effect
router.post('/medications/:id/side-effects', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;
    const { symptom, severity, occurredAt, durationMinutes, notes } = req.body;

    if (!symptom || !severity) {
      return res.status(400).json({ error: 'Symptom and severity are required' });
    }

    // Verify ownership
    const medicationCheck = await pool.query(
      'SELECT id FROM medications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (medicationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    const result = await pool.query(
      `INSERT INTO medication_side_effects
       (medication_id, symptom, severity, occurred_at, duration_minutes, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, symptom, severity, occurredAt || new Date(), durationMinutes, notes]
    );

    res.json({
      message: 'Side effect reported',
      sideEffect: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error reporting side effect:', error);
    res.status(500).json({ error: 'Failed to report side effect' });
  }
});

// ============================================
// REMINDERS
// ============================================

// POST /api/medications/:id/reminders - Create reminder
router.post('/medications/:id/reminders', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;
    const { reminderTime, daysOfWeek, notificationMethod } = req.body;

    if (!reminderTime || !daysOfWeek || daysOfWeek.length === 0) {
      return res.status(400).json({ error: 'Reminder time and days are required' });
    }

    // Verify ownership
    const medicationCheck = await pool.query(
      'SELECT id FROM medications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (medicationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    const result = await pool.query(
      `INSERT INTO medication_reminders
       (medication_id, reminder_time, days_of_week, notification_method)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, reminderTime, daysOfWeek, notificationMethod || 'in_app']
    );

    res.json({
      message: 'Reminder created',
      reminder: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// PUT /api/reminders/:id - Update reminder
router.put('/reminders/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;
    const { reminderTime, daysOfWeek, isEnabled } = req.body;

    // Verify ownership through medication
    const verifyResult = await pool.query(
      `SELECT mr.id FROM medication_reminders mr
       JOIN medications m ON mr.medication_id = m.id
       WHERE mr.id = $1 AND m.user_id = $2`,
      [id, userId]
    );

    if (verifyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const result = await pool.query(
      `UPDATE medication_reminders
       SET reminder_time = COALESCE($2, reminder_time),
           days_of_week = COALESCE($3, days_of_week),
           is_enabled = COALESCE($4, is_enabled),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, reminderTime, daysOfWeek, isEnabled]
    );

    res.json({
      message: 'Reminder updated',
      reminder: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// DELETE /api/reminders/:id - Delete reminder
router.delete('/reminders/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;

    // Verify ownership through medication
    const result = await pool.query(
      `DELETE FROM medication_reminders mr
       USING medications m
       WHERE mr.id = $1 AND mr.medication_id = m.id AND m.user_id = $2
       RETURNING mr.id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ message: 'Reminder deleted' });
  } catch (error: any) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

// ============================================
// EFFECTIVENESS TRACKING
// ============================================

// POST /api/medications/:id/effectiveness - Log effectiveness assessment
router.post('/medications/:id/effectiveness', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;
    const {
      assessmentDate,
      effectivenessRating,
      symptomsImproved,
      symptomsUnchanged,
      symptomsWorsened,
      overallMood,
      wouldContinue,
      notes
    } = req.body;

    if (!effectivenessRating) {
      return res.status(400).json({ error: 'Effectiveness rating is required' });
    }

    // Verify ownership
    const medicationCheck = await pool.query(
      'SELECT id FROM medications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (medicationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    const result = await pool.query(
      `INSERT INTO medication_effectiveness
       (medication_id, assessment_date, effectiveness_rating, symptoms_improved,
        symptoms_unchanged, symptoms_worsened, overall_mood, would_continue, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, assessmentDate || new Date(), effectivenessRating, symptomsImproved,
       symptomsUnchanged, symptomsWorsened, overallMood, wouldContinue, notes]
    );

    res.json({
      message: 'Effectiveness assessment logged',
      assessment: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error logging effectiveness:', error);
    res.status(500).json({ error: 'Failed to log effectiveness' });
  }
});

// ============================================
// REFILLS
// ============================================

// POST /api/medications/:id/refills - Log refill
router.post('/medications/:id/refills', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;
    const { refillDate, quantity, pharmacy, cost, notes } = req.body;

    if (!quantity) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    // Verify ownership
    const medicationCheck = await pool.query(
      'SELECT id, remaining_quantity FROM medications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (medicationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    // Log refill
    const refillResult = await pool.query(
      `INSERT INTO medication_refills
       (medication_id, refill_date, quantity, pharmacy, cost, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, refillDate || new Date(), quantity, pharmacy, cost, notes]
    );

    // Update medication quantity
    const currentRemaining = medicationCheck.rows[0].remaining_quantity || 0;
    await pool.query(
      `UPDATE medications
       SET remaining_quantity = $2,
           total_quantity = $3
       WHERE id = $1`,
      [id, currentRemaining + quantity, quantity]
    );

    res.json({
      message: 'Refill logged',
      refill: refillResult.rows[0]
    });
  } catch (error: any) {
    console.error('Error logging refill:', error);
    res.status(500).json({ error: 'Failed to log refill' });
  }
});

// GET /api/medications/:id/refills - Get refill history
router.get('/medications/:id/refills', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;

    // Verify ownership
    const medicationCheck = await pool.query(
      'SELECT id FROM medications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (medicationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    const result = await pool.query(
      `SELECT * FROM medication_refills
       WHERE medication_id = $1
       ORDER BY refill_date DESC`,
      [id]
    );

    res.json({ refills: result.rows });
  } catch (error: any) {
    console.error('Error fetching refills:', error);
    res.status(500).json({ error: 'Failed to fetch refills' });
  }
});

export default router;
