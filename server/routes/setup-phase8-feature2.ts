import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// Run Phase 8 Feature 2 migration (Therapist Portal)
router.post('/setup/phase8-feature2', async (req: Request, res: Response) => {
  try {
    console.log('Running Phase 8 Feature 2 migration (Therapist Portal)...');

    // Therapist Profiles
    await pool.query(`
      CREATE TABLE IF NOT EXISTS therapist_profiles (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        license_number VARCHAR(100),
        license_type VARCHAR(100),
        specialization TEXT[],
        bio TEXT,
        credentials TEXT,
        years_experience INTEGER,
        verified BOOLEAN DEFAULT false,
        verification_date TIMESTAMP,
        accepts_new_clients BOOLEAN DEFAULT true,
        hourly_rate DECIMAL(10,2),
        session_duration INTEGER DEFAULT 60,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_therapist_profiles_user
        ON therapist_profiles(user_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_therapist_profiles_verified
        ON therapist_profiles(verified, accepts_new_clients)
    `);

    console.log('✅ Therapist profiles table created');

    // Client-Therapist Relationships
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_therapist_relationships (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        client_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        therapist_id VARCHAR NOT NULL REFERENCES therapist_profiles(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        start_date TIMESTAMP DEFAULT NOW(),
        end_date TIMESTAMP,
        termination_reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_client_therapist_relationships_client
        ON client_therapist_relationships(client_id, status)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_client_therapist_relationships_therapist
        ON client_therapist_relationships(therapist_id, status)
    `);

    console.log('✅ Client-therapist relationships table created');

    // Therapy Sessions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS therapy_sessions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        relationship_id VARCHAR NOT NULL REFERENCES client_therapist_relationships(id) ON DELETE CASCADE,
        session_date TIMESTAMP NOT NULL,
        duration INTEGER NOT NULL,
        session_type VARCHAR(50) DEFAULT 'individual',
        status VARCHAR(50) DEFAULT 'scheduled',
        cancellation_reason TEXT,
        client_mood_before INTEGER,
        client_mood_after INTEGER,
        therapist_notes TEXT,
        treatment_modality VARCHAR(100),
        next_session_date TIMESTAMP,
        homework_assigned TEXT,
        progress_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_therapy_sessions_relationship
        ON therapy_sessions(relationship_id, session_date DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_therapy_sessions_date
        ON therapy_sessions(session_date, status)
    `);

    console.log('✅ Therapy sessions table created');

    // Session Notes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session_notes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        session_id VARCHAR NOT NULL REFERENCES therapy_sessions(id) ON DELETE CASCADE,
        note_type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        is_private BOOLEAN DEFAULT true,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_session_notes_session
        ON session_notes(session_id, created_at DESC)
    `);

    console.log('✅ Session notes table created');

    // Treatment Goals
    await pool.query(`
      CREATE TABLE IF NOT EXISTS treatment_goals (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        relationship_id VARCHAR NOT NULL REFERENCES client_therapist_relationships(id) ON DELETE CASCADE,
        goal_text TEXT NOT NULL,
        category VARCHAR(50),
        target_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        progress_percentage INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_treatment_goals_relationship
        ON treatment_goals(relationship_id, status)
    `);

    console.log('✅ Treatment goals table created');

    // Session Reminders
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session_reminders (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        session_id VARCHAR NOT NULL REFERENCES therapy_sessions(id) ON DELETE CASCADE,
        recipient_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reminder_type VARCHAR(50) NOT NULL,
        scheduled_for TIMESTAMP NOT NULL,
        sent_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_session_reminders_scheduled
        ON session_reminders(scheduled_for, status)
    `);

    console.log('✅ Session reminders table created');

    // Therapist Availability
    await pool.query(`
      CREATE TABLE IF NOT EXISTS therapist_availability (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        therapist_id VARCHAR NOT NULL REFERENCES therapist_profiles(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_therapist_availability_therapist
        ON therapist_availability(therapist_id, day_of_week)
    `);

    console.log('✅ Therapist availability table created');

    // Client Progress Reports
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_progress_reports (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        relationship_id VARCHAR NOT NULL REFERENCES client_therapist_relationships(id) ON DELETE CASCADE,
        report_period_start DATE NOT NULL,
        report_period_end DATE NOT NULL,
        summary TEXT NOT NULL,
        progress_assessment TEXT,
        challenges TEXT,
        recommendations TEXT,
        goals_achieved TEXT[],
        goals_in_progress TEXT[],
        created_by VARCHAR NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_client_progress_reports_relationship
        ON client_progress_reports(relationship_id, created_at DESC)
    `);

    console.log('✅ Client progress reports table created');

    // Triggers
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_therapist_portal_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    const triggers = [
      { table: 'therapist_profiles', trigger: 'therapist_profiles_updated_at_trigger' },
      { table: 'client_therapist_relationships', trigger: 'client_therapist_relationships_updated_at_trigger' },
      { table: 'therapy_sessions', trigger: 'therapy_sessions_updated_at_trigger' },
      { table: 'session_notes', trigger: 'session_notes_updated_at_trigger' },
      { table: 'treatment_goals', trigger: 'treatment_goals_updated_at_trigger' }
    ];

    for (const { table, trigger } of triggers) {
      await pool.query(`
        DROP TRIGGER IF EXISTS ${trigger} ON ${table};
        CREATE TRIGGER ${trigger}
          BEFORE UPDATE ON ${table}
          FOR EACH ROW
          EXECUTE FUNCTION update_therapist_portal_updated_at()
      `);
    }

    console.log('✅ Triggers created');

    res.json({
      message: '✅ Phase 8 Feature 2 (Therapist Portal) tables created successfully!',
      tables: [
        'therapist_profiles',
        'client_therapist_relationships',
        'therapy_sessions',
        'session_notes',
        'treatment_goals',
        'session_reminders',
        'therapist_availability',
        'client_progress_reports'
      ]
    });
  } catch (error: any) {
    console.error('❌ Phase 8 Feature 2 migration error:', error);
    res.status(500).json({
      error: 'Failed to run Phase 8 Feature 2 migration',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
