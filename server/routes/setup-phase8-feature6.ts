import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

router.post('/setup/phase8-feature6', async (req: Request, res: Response) => {
  try {
    console.log('Running Phase 8 Feature 6 migration (Enhanced Crisis Response)...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS crisis_events (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        severity VARCHAR(20) NOT NULL,
        crisis_type VARCHAR(100),
        detected_by VARCHAR(50),
        trigger_content TEXT,
        status VARCHAR(50) DEFAULT 'active',
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_crisis_events_user ON crisis_events(user_id, created_at DESC)`);
    console.log('✅ Crisis events table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS safety_plans (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        warning_signs TEXT[],
        coping_strategies TEXT[],
        distractions TEXT[],
        support_contacts JSONB,
        things_to_live_for TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Safety plans table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS crisis_interventions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        crisis_event_id VARCHAR NOT NULL REFERENCES crisis_events(id) ON DELETE CASCADE,
        intervention_type VARCHAR(100) NOT NULL,
        content TEXT,
        was_effective BOOLEAN,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Crisis interventions table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        relationship VARCHAR(100),
        phone_number VARCHAR(50) NOT NULL,
        priority INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Emergency contacts table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS crisis_checkins (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scheduled_for TIMESTAMP NOT NULL,
        completed_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        mood_rating INTEGER,
        safety_rating INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Crisis check-ins table created');

    res.json({
      message: '✅ Phase 8 Feature 6 (Enhanced Crisis Response) tables created successfully!',
      tables: ['crisis_events', 'safety_plans', 'crisis_interventions', 'emergency_contacts', 'crisis_checkins']
    });
  } catch (error: any) {
    console.error('❌ Phase 8 Feature 6 migration error:', error);
    res.status(500).json({ error: 'Failed to run Phase 8 Feature 6 migration', details: error.message });
  }
});

export default router;
