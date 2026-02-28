import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// Run Phase 8 Feature 3 migration (Medication Tracker)
router.post('/setup/phase8-feature3', async (req: Request, res: Response) => {
  try {
    console.log('Running Phase 8 Feature 3 migration (Medication Tracker)...');

    // Medications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        dosage VARCHAR(100),
        frequency VARCHAR(100),
        prescribed_by VARCHAR(255),
        prescription_date DATE,
        start_date DATE NOT NULL,
        end_date DATE,
        is_active BOOLEAN DEFAULT true,
        reason VARCHAR(500),
        instructions TEXT,
        refill_reminder_days INTEGER DEFAULT 7,
        total_quantity INTEGER,
        remaining_quantity INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_medications_user
        ON medications(user_id, is_active)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_medications_user_active
        ON medications(user_id, is_active, start_date DESC)
    `);

    console.log('✅ Medications table created');

    // Medication Logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medication_logs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        medication_id VARCHAR NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
        taken_at TIMESTAMP NOT NULL,
        dosage_taken VARCHAR(100),
        was_taken BOOLEAN NOT NULL DEFAULT true,
        skip_reason TEXT,
        notes TEXT,
        mood_before INTEGER,
        mood_after INTEGER,
        side_effects_experienced TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_medication_logs_medication
        ON medication_logs(medication_id, taken_at DESC)
    `);

    console.log('✅ Medication logs table created');

    // Side Effects
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medication_side_effects (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        medication_id VARCHAR NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
        symptom VARCHAR(255) NOT NULL,
        severity INTEGER CHECK (severity BETWEEN 1 AND 10),
        occurred_at TIMESTAMP NOT NULL,
        duration_minutes INTEGER,
        notes TEXT,
        reported_to_doctor BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_medication_side_effects_medication
        ON medication_side_effects(medication_id, occurred_at DESC)
    `);

    console.log('✅ Side effects table created');

    // Medication Reminders
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medication_reminders (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        medication_id VARCHAR NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
        reminder_time TIME NOT NULL,
        days_of_week INTEGER[] NOT NULL,
        is_enabled BOOLEAN DEFAULT true,
        notification_method VARCHAR(50) DEFAULT 'in_app',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_medication_reminders_medication
        ON medication_reminders(medication_id, is_enabled)
    `);

    console.log('✅ Medication reminders table created');

    // Medication Interactions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medication_interactions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        medication_1_name VARCHAR(255) NOT NULL,
        medication_2_name VARCHAR(255) NOT NULL,
        interaction_severity VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        recommendation TEXT,
        source VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_medication_interactions_lookup
        ON medication_interactions(medication_1_name, medication_2_name)
    `);

    console.log('✅ Medication interactions table created');

    // Medication Effectiveness
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medication_effectiveness (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        medication_id VARCHAR NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
        assessment_date DATE NOT NULL,
        effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 10),
        symptoms_improved TEXT[],
        symptoms_unchanged TEXT[],
        symptoms_worsened TEXT[],
        overall_mood INTEGER,
        would_continue BOOLEAN,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_medication_effectiveness_medication
        ON medication_effectiveness(medication_id, assessment_date DESC)
    `);

    console.log('✅ Medication effectiveness table created');

    // Medication Refills
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medication_refills (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        medication_id VARCHAR NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
        refill_date DATE NOT NULL,
        quantity INTEGER NOT NULL,
        pharmacy VARCHAR(255),
        cost DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_medication_refills_medication
        ON medication_refills(medication_id, refill_date DESC)
    `);

    console.log('✅ Medication refills table created');

    // Triggers
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_medication_tracker_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS medications_updated_at_trigger ON medications;
      CREATE TRIGGER medications_updated_at_trigger
        BEFORE UPDATE ON medications
        FOR EACH ROW
        EXECUTE FUNCTION update_medication_tracker_updated_at()
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS medication_reminders_updated_at_trigger ON medication_reminders;
      CREATE TRIGGER medication_reminders_updated_at_trigger
        BEFORE UPDATE ON medication_reminders
        FOR EACH ROW
        EXECUTE FUNCTION update_medication_tracker_updated_at()
    `);

    // Quantity update trigger
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_medication_quantity()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.was_taken = true THEN
          UPDATE medications
          SET remaining_quantity = GREATEST(0, remaining_quantity - 1)
          WHERE id = NEW.medication_id
            AND remaining_quantity IS NOT NULL;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS medication_logs_update_quantity_trigger ON medication_logs;
      CREATE TRIGGER medication_logs_update_quantity_trigger
        AFTER INSERT ON medication_logs
        FOR EACH ROW
        EXECUTE FUNCTION update_medication_quantity()
    `);

    console.log('✅ Triggers created');

    res.json({
      message: '✅ Phase 8 Feature 3 (Medication Tracker) tables created successfully!',
      tables: [
        'medications',
        'medication_logs',
        'medication_side_effects',
        'medication_reminders',
        'medication_interactions',
        'medication_effectiveness',
        'medication_refills'
      ]
    });
  } catch (error: any) {
    console.error('❌ Phase 8 Feature 3 migration error:', error);
    res.status(500).json({
      error: 'Failed to run Phase 8 Feature 3 migration',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
