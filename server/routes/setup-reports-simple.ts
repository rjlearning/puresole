import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// Simple migration endpoint - SQL embedded directly
router.post('/setup/reports-migration-simple', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Running Phase 6 Week 2 migration (simple)...');

    // Create wellness_reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wellness_reports (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        title VARCHAR(255) NOT NULL,
        report_type VARCHAR(50) NOT NULL,

        start_date DATE NOT NULL,
        end_date DATE NOT NULL,

        data JSONB NOT NULL,
        summary TEXT,
        key_insights JSONB,

        pdf_url VARCHAR(500),
        pdf_size INTEGER,
        share_code VARCHAR(50) UNIQUE,
        share_expires_at TIMESTAMP,

        view_count INTEGER DEFAULT 0,
        last_viewed_at TIMESTAMP,
        downloaded_count INTEGER DEFAULT 0,
        last_downloaded_at TIMESTAMP,

        status VARCHAR(50) DEFAULT 'draft',
        generation_error TEXT,

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_wellness_reports_user ON wellness_reports(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_wellness_reports_share_code ON wellness_reports(share_code) WHERE share_code IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_wellness_reports_status ON wellness_reports(status);
      CREATE INDEX IF NOT EXISTS idx_wellness_reports_date_range ON wellness_reports(user_id, start_date, end_date);
    `);

    console.log('✅ wellness_reports table created');

    // Create report_access_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS report_access_logs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        report_id VARCHAR NOT NULL REFERENCES wellness_reports(id) ON DELETE CASCADE,

        access_type VARCHAR(50) NOT NULL,
        accessor_type VARCHAR(50),
        accessor_id VARCHAR,

        ip_address VARCHAR(50),
        user_agent TEXT,

        accessed_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_report_access_logs_report ON report_access_logs(report_id, accessed_at DESC);
    `);

    console.log('✅ report_access_logs table created');

    // Create report_templates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS report_templates (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        report_type VARCHAR(50) NOT NULL,

        sections JSONB NOT NULL,
        default_date_range INTEGER,

        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ report_templates table created');

    // Seed templates
    await pool.query(`
      INSERT INTO report_templates (name, description, report_type, sections, default_date_range)
      VALUES
        (
          'Weekly Wellness Summary',
          'A comprehensive weekly overview of your mental health journey',
          'weekly',
          '[
            {"id": "emotional_trends", "title": "Emotional Trends", "type": "chart"},
            {"id": "voice_insights", "title": "Voice Journal Insights", "type": "list"},
            {"id": "activities_completed", "title": "Activities Completed", "type": "stats"},
            {"id": "goals_progress", "title": "Goals Progress", "type": "progress"},
            {"id": "crisis_indicators", "title": "Crisis Indicators", "type": "alert"}
          ]'::jsonb,
          7
        ),
        (
          'Monthly Progress Report',
          'A detailed monthly report showing progress and patterns',
          'monthly',
          '[
            {"id": "monthly_overview", "title": "Monthly Overview", "type": "summary"},
            {"id": "emotional_patterns", "title": "Emotional Patterns", "type": "heatmap"},
            {"id": "activity_trends", "title": "Activity Trends", "type": "chart"},
            {"id": "goals_achievements", "title": "Goals Achievements", "type": "list"},
            {"id": "wellness_score", "title": "Wellness Score", "type": "gauge"}
          ]'::jsonb,
          30
        ),
        (
          'Therapist Report',
          'A comprehensive report designed for sharing with mental health professionals',
          'therapist',
          '[
            {"id": "patient_summary", "title": "Patient Summary", "type": "overview"},
            {"id": "emotional_timeline", "title": "Emotional Timeline", "type": "timeline"},
            {"id": "crisis_events", "title": "Crisis Events & Triggers", "type": "alert"},
            {"id": "activities_engagement", "title": "Activities Engagement", "type": "stats"},
            {"id": "goals_tracking", "title": "Goals Tracking", "type": "detailed"}
          ]'::jsonb,
          30
        )
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ Templates seeded');

    // Create trigger
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_wellness_reports_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS wellness_reports_updated_at ON wellness_reports;

      CREATE TRIGGER wellness_reports_updated_at
        BEFORE UPDATE ON wellness_reports
        FOR EACH ROW
        EXECUTE FUNCTION update_wellness_reports_updated_at();
    `);

    console.log('✅ Trigger created');

    // Get counts
    const reportsCount = await pool.query('SELECT COUNT(*) FROM wellness_reports');
    const templatesCount = await pool.query('SELECT COUNT(*) FROM report_templates');
    const logsCount = await pool.query('SELECT COUNT(*) FROM report_access_logs');

    console.log('✅ Phase 6 Week 2 migration complete!');

    res.json({
      message: 'Migration completed successfully',
      tables: {
        wellness_reports: parseInt(reportsCount.rows[0].count),
        report_templates: parseInt(templatesCount.rows[0].count),
        report_access_logs: parseInt(logsCount.rows[0].count)
      }
    });
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      error: 'Migration failed',
      details: error.message,
      stack: error.stack
    });
  }
});

export default router;
