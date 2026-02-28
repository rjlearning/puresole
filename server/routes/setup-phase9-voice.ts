import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

/**
 * Phase 9: Voice-Based Mental Health Analysis
 * POST /api/setup/phase9-voice
 *
 * This migration sets up the complete infrastructure for voice analysis:
 * - voice_analyses: Core analysis results for recordings
 * - voice_wellness_trends: Aggregated wellness metrics over time
 * - voice_realtime_sessions: Real-time emotion tracking sessions
 * - voice_correlations: Correlations with mood, sleep, medication
 * - voice_user_settings: User preferences and consent
 */
router.post('/setup/phase9-voice', async (req: Request, res: Response) => {
  try {
    console.log('🎤 Running Phase 9: Voice Analysis Migration...');

    // Create emotion enum for voice analyses
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE voice_emotion AS ENUM (
          'happy',
          'sad',
          'anxious',
          'stressed',
          'calm',
          'angry',
          'fearful',
          'surprised',
          'neutral',
          'excited',
          'tired'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create processing status enum
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE voice_processing_status AS ENUM (
          'pending',
          'processing',
          'completed',
          'failed',
          'cancelled'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create risk level enum
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE voice_risk_level AS ENUM (
          'low',
          'medium',
          'high',
          'critical'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create trend direction enum
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE voice_trend_direction AS ENUM (
          'improving',
          'stable',
          'declining',
          'insufficient_data'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('✅ Voice analysis enums created');

    // Table 1: voice_analyses
    console.log('Creating voice_analyses table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS voice_analyses (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        journal_entry_id VARCHAR,

        -- Audio file metadata
        audio_file_path TEXT NOT NULL,
        audio_file_size INTEGER,
        duration_seconds DECIMAL(10, 2) NOT NULL,
        sample_rate INTEGER,

        -- Transcription
        transcript TEXT,
        transcript_confidence DECIMAL(5, 4),
        language_detected VARCHAR(10),

        -- Emotion analysis
        primary_emotion voice_emotion NOT NULL,
        emotion_confidence DECIMAL(5, 4) NOT NULL,
        emotion_scores JSONB NOT NULL DEFAULT '{}',

        -- Dimensional emotion (valence-arousal model)
        valence DECIMAL(5, 4), -- -1 (negative) to 1 (positive)
        arousal DECIMAL(5, 4), -- 0 (calm) to 1 (excited)
        dominance DECIMAL(5, 4), -- 0 (submissive) to 1 (dominant)

        -- Acoustic features (stored for correlation analysis)
        acoustic_features JSONB NOT NULL DEFAULT '{}',

        -- Linguistic features (from transcript)
        linguistic_features JSONB NOT NULL DEFAULT '{}',

        -- Stress and mental health indicators
        stress_indicators JSONB NOT NULL DEFAULT '{}',

        -- Overall wellness assessment
        wellness_score DECIMAL(5, 2) NOT NULL CHECK (wellness_score >= 0 AND wellness_score <= 100),
        risk_level voice_risk_level NOT NULL DEFAULT 'low',
        crisis_keywords TEXT[] DEFAULT '{}',

        -- Processing metadata
        processing_status voice_processing_status NOT NULL DEFAULT 'pending',
        processing_started_at TIMESTAMP,
        processing_completed_at TIMESTAMP,
        processing_time_ms INTEGER,
        processing_error TEXT,
        model_version VARCHAR(50),

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_voice_analyses_user_id ON voice_analyses(user_id);
      CREATE INDEX IF NOT EXISTS idx_voice_analyses_created_at ON voice_analyses(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_voice_analyses_journal_entry ON voice_analyses(journal_entry_id);
      CREATE INDEX IF NOT EXISTS idx_voice_analyses_risk_level ON voice_analyses(risk_level) WHERE risk_level IN ('high', 'critical');
      CREATE INDEX IF NOT EXISTS idx_voice_analyses_processing_status ON voice_analyses(processing_status);
    `);

    console.log('✅ voice_analyses table created');

    // Table 2: voice_wellness_trends
    console.log('Creating voice_wellness_trends table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS voice_wellness_trends (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Time period
        period_start TIMESTAMP NOT NULL,
        period_end TIMESTAMP NOT NULL,
        period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('day', 'week', 'month', 'quarter', 'year')),

        -- Aggregated metrics
        recording_count INTEGER NOT NULL DEFAULT 0,
        total_duration_seconds DECIMAL(10, 2) NOT NULL DEFAULT 0,

        -- Average dimensional scores
        avg_valence DECIMAL(5, 4),
        avg_arousal DECIMAL(5, 4),
        avg_wellness_score DECIMAL(5, 2),

        -- Emotion distribution
        emotion_distribution JSONB NOT NULL DEFAULT '{}',

        -- Trend analysis
        trend_direction voice_trend_direction NOT NULL DEFAULT 'insufficient_data',
        trend_confidence DECIMAL(5, 4),

        -- Comparison to previous period
        valence_change DECIMAL(5, 4),
        wellness_change DECIMAL(5, 2),

        -- Risk flags
        high_risk_count INTEGER NOT NULL DEFAULT 0,
        crisis_keyword_count INTEGER NOT NULL DEFAULT 0,

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),

        UNIQUE(user_id, period_start, period_type)
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_voice_trends_user_period ON voice_wellness_trends(user_id, period_start DESC);
      CREATE INDEX IF NOT EXISTS idx_voice_trends_period_type ON voice_wellness_trends(period_type, period_start DESC);
    `);

    console.log('✅ voice_wellness_trends table created');

    // Table 3: voice_realtime_sessions
    console.log('Creating voice_realtime_sessions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS voice_realtime_sessions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        conversation_id VARCHAR,

        -- Session timing
        started_at TIMESTAMP NOT NULL DEFAULT NOW(),
        end_time TIMESTAMP,
        duration_seconds DECIMAL(10, 2),

        -- Emotion timeline
        emotion_timeline JSONB NOT NULL DEFAULT '[]',

        -- Session statistics
        emotion_shifts_count INTEGER NOT NULL DEFAULT 0,
        dominant_emotion voice_emotion,
        average_arousal DECIMAL(5, 4),
        average_valence DECIMAL(5, 4),

        -- Real-time insights
        session_insights JSONB DEFAULT '[]',

        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_realtime_sessions_user ON voice_realtime_sessions(user_id, started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_realtime_sessions_conversation ON voice_realtime_sessions(conversation_id);
    `);

    console.log('✅ voice_realtime_sessions table created');

    // Table 4: voice_correlations
    console.log('Creating voice_correlations table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS voice_correlations (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        analysis_id VARCHAR NOT NULL REFERENCES voice_analyses(id) ON DELETE CASCADE,

        -- Related data references (foreign keys added later if tables exist)
        mood_log_id VARCHAR,
        sleep_log_id VARCHAR,
        medication_log_id VARCHAR,
        activity_id VARCHAR,

        -- Correlation metadata
        correlation_type VARCHAR(50) NOT NULL CHECK (correlation_type IN ('mood', 'sleep', 'medication', 'activity', 'custom')),
        time_delta_hours DECIMAL(10, 2),

        -- Correlation data
        correlation_data JSONB NOT NULL DEFAULT '{}',
        correlation_strength DECIMAL(5, 4),
        confidence_score DECIMAL(5, 4),

        -- Analysis notes
        notes TEXT,

        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_voice_correlations_user ON voice_correlations(user_id);
      CREATE INDEX IF NOT EXISTS idx_voice_correlations_analysis ON voice_correlations(analysis_id);
      CREATE INDEX IF NOT EXISTS idx_voice_correlations_type ON voice_correlations(correlation_type);
    `);

    console.log('✅ voice_correlations table created');

    // Table 5: voice_user_settings
    console.log('Creating voice_user_settings table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS voice_user_settings (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

        -- Feature toggles
        enable_recording_analysis BOOLEAN NOT NULL DEFAULT false,
        enable_realtime_analysis BOOLEAN NOT NULL DEFAULT false,
        auto_analyze_journal BOOLEAN NOT NULL DEFAULT true,
        show_emotion_insights BOOLEAN NOT NULL DEFAULT true,
        enable_crisis_monitoring BOOLEAN NOT NULL DEFAULT true,

        -- Alert preferences
        crisis_alert_threshold voice_risk_level NOT NULL DEFAULT 'high',
        notify_on_wellness_drop BOOLEAN NOT NULL DEFAULT false,
        wellness_drop_threshold DECIMAL(5, 2) DEFAULT 15.0,

        -- Data retention
        data_retention_days INTEGER NOT NULL DEFAULT 90,
        auto_delete_audio BOOLEAN NOT NULL DEFAULT true,
        retain_features_only BOOLEAN NOT NULL DEFAULT true,

        -- Privacy and consent
        consent_given BOOLEAN NOT NULL DEFAULT false,
        consent_date TIMESTAMP,
        consent_version VARCHAR(20),
        privacy_policy_accepted BOOLEAN NOT NULL DEFAULT false,

        -- Sharing preferences
        share_with_therapist BOOLEAN NOT NULL DEFAULT false,
        therapist_can_view_transcripts BOOLEAN NOT NULL DEFAULT false,

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_voice_settings_user ON voice_user_settings(user_id);
    `);

    console.log('✅ voice_user_settings table created');

    // Create triggers for updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_voice_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_voice_analyses_timestamp ON voice_analyses;
      CREATE TRIGGER update_voice_analyses_timestamp
        BEFORE UPDATE ON voice_analyses
        FOR EACH ROW
        EXECUTE FUNCTION update_voice_updated_at();

      DROP TRIGGER IF EXISTS update_voice_trends_timestamp ON voice_wellness_trends;
      CREATE TRIGGER update_voice_trends_timestamp
        BEFORE UPDATE ON voice_wellness_trends
        FOR EACH ROW
        EXECUTE FUNCTION update_voice_updated_at();

      DROP TRIGGER IF EXISTS update_voice_settings_timestamp ON voice_user_settings;
      CREATE TRIGGER update_voice_settings_timestamp
        BEFORE UPDATE ON voice_user_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_voice_updated_at();
    `);

    console.log('✅ Triggers created for updated_at timestamps');

    // Optionally add foreign keys if referenced tables exist
    const optionalForeignKeys = [
      {
        table: 'journal_entries',
        constraint: 'fk_voice_analyses_journal_entry',
        alterTable: 'voice_analyses',
        column: 'journal_entry_id',
        references: 'journal_entries(id)',
        onDelete: 'SET NULL'
      },
      {
        table: 'chat_conversations',
        constraint: 'fk_realtime_sessions_conversation',
        alterTable: 'voice_realtime_sessions',
        column: 'conversation_id',
        references: 'chat_conversations(id)',
        onDelete: 'CASCADE'
      },
      {
        table: 'mood_logs',
        constraint: 'fk_correlations_mood_log',
        alterTable: 'voice_correlations',
        column: 'mood_log_id',
        references: 'mood_logs(id)',
        onDelete: 'SET NULL'
      },
      {
        table: 'sleep_logs',
        constraint: 'fk_correlations_sleep_log',
        alterTable: 'voice_correlations',
        column: 'sleep_log_id',
        references: 'sleep_logs(id)',
        onDelete: 'SET NULL'
      },
      {
        table: 'medication_logs',
        constraint: 'fk_correlations_medication_log',
        alterTable: 'voice_correlations',
        column: 'medication_log_id',
        references: 'medication_logs(id)',
        onDelete: 'SET NULL'
      },
      {
        table: 'activities',
        constraint: 'fk_correlations_activity',
        alterTable: 'voice_correlations',
        column: 'activity_id',
        references: 'activities(id)',
        onDelete: 'SET NULL'
      }
    ];

    for (const fk of optionalForeignKeys) {
      try {
        const { rows } = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
          );
        `, [fk.table]);

        if (rows[0].exists) {
          await pool.query(`
            DO $$ BEGIN
              ALTER TABLE ${fk.alterTable}
              ADD CONSTRAINT ${fk.constraint}
              FOREIGN KEY (${fk.column})
              REFERENCES ${fk.references}
              ON DELETE ${fk.onDelete};
            EXCEPTION
              WHEN duplicate_object THEN null;
            END $$;
          `);
          console.log(`✅ Added foreign key constraint to ${fk.table}`);
        } else {
          console.log(`ℹ️  ${fk.table} table not found, skipping foreign key constraint`);
        }
      } catch (fkError) {
        console.log(`ℹ️  Could not add ${fk.table} foreign key (table may not exist yet)`);
      }
    }

    res.json({
      message: '✅ Phase 9: Voice Analysis setup completed successfully!',
      tables: [
        'voice_analyses',
        'voice_wellness_trends',
        'voice_realtime_sessions',
        'voice_correlations',
        'voice_user_settings'
      ],
      enums: [
        'voice_emotion',
        'voice_processing_status',
        'voice_risk_level',
        'voice_trend_direction'
      ]
    });

  } catch (error: any) {
    console.error('❌ Phase 9 Voice Analysis migration error:', error);
    res.status(500).json({
      error: 'Failed to run Phase 9 Voice Analysis migration',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
