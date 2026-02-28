-- Phase 6 Week 2: Wellness Reports & PDF Export
-- Allows users to generate comprehensive reports of their mental health journey

-- Wellness Reports Table
CREATE TABLE IF NOT EXISTS wellness_reports (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Report Metadata
  title VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'custom', 'therapist'

  -- Date Range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Report Data (aggregated metrics)
  data JSONB NOT NULL, -- {emotionalTrends, activities, goals, voiceInsights, etc.}

  -- Summary & Insights
  summary TEXT, -- AI-generated or user-written summary
  key_insights JSONB, -- [{type, title, description, severity}]

  -- File & Sharing
  pdf_url VARCHAR(500), -- Path to generated PDF
  pdf_size INTEGER, -- File size in bytes
  share_code VARCHAR(50) UNIQUE, -- For sharing with therapists
  share_expires_at TIMESTAMP, -- When share link expires

  -- Access Tracking
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP,
  downloaded_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP,

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'generating', 'ready', 'shared', 'archived'
  generation_error TEXT, -- Error message if generation failed

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wellness_reports_user ON wellness_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wellness_reports_share_code ON wellness_reports(share_code) WHERE share_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wellness_reports_status ON wellness_reports(status);
CREATE INDEX IF NOT EXISTS idx_wellness_reports_date_range ON wellness_reports(user_id, start_date, end_date);

-- Report Access Log (track who views shared reports)
CREATE TABLE IF NOT EXISTS report_access_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  report_id VARCHAR NOT NULL REFERENCES wellness_reports(id) ON DELETE CASCADE,

  -- Access Details
  access_type VARCHAR(50) NOT NULL, -- 'view', 'download', 'share'
  accessor_type VARCHAR(50), -- 'user', 'therapist', 'public', 'anonymous'
  accessor_id VARCHAR, -- User ID or therapist ID if known

  ip_address VARCHAR(50),
  user_agent TEXT,

  accessed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_access_logs_report ON report_access_logs(report_id, accessed_at DESC);

-- Trigger to update wellness_reports.updated_at
CREATE OR REPLACE FUNCTION update_wellness_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wellness_reports_updated_at
  BEFORE UPDATE ON wellness_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_wellness_reports_updated_at();

-- Sample report template data (optional)
-- This helps standardize report structure
CREATE TABLE IF NOT EXISTS report_templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL,

  -- Template Configuration
  sections JSONB NOT NULL, -- [{id, title, type, config}]
  default_date_range INTEGER, -- Days to look back (7, 30, 90, etc.)

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed default report templates
INSERT INTO report_templates (name, description, report_type, sections, default_date_range) VALUES
  (
    'Weekly Wellness Summary',
    'A comprehensive weekly overview of your mental health journey',
    'weekly',
    '[
      {"id": "emotional_trends", "title": "Emotional Trends", "type": "chart", "config": {"chartType": "line"}},
      {"id": "voice_insights", "title": "Voice Journal Insights", "type": "list", "config": {"limit": 5}},
      {"id": "activities_completed", "title": "Activities Completed", "type": "stats", "config": {}},
      {"id": "goals_progress", "title": "Goals Progress", "type": "progress", "config": {}},
      {"id": "crisis_indicators", "title": "Crisis Indicators", "type": "alert", "config": {"threshold": "high"}}
    ]'::jsonb,
    7
  ),
  (
    'Monthly Progress Report',
    'A detailed monthly report showing progress and patterns',
    'monthly',
    '[
      {"id": "monthly_overview", "title": "Monthly Overview", "type": "summary", "config": {}},
      {"id": "emotional_patterns", "title": "Emotional Patterns", "type": "heatmap", "config": {}},
      {"id": "activity_trends", "title": "Activity Trends", "type": "chart", "config": {"chartType": "bar"}},
      {"id": "goals_achievements", "title": "Goals Achievements", "type": "list", "config": {}},
      {"id": "wellness_score", "title": "Wellness Score", "type": "gauge", "config": {}},
      {"id": "recommendations", "title": "Recommendations", "type": "list", "config": {}}
    ]'::jsonb,
    30
  ),
  (
    'Therapist Report',
    'A comprehensive report designed for sharing with mental health professionals',
    'therapist',
    '[
      {"id": "patient_summary", "title": "Patient Summary", "type": "overview", "config": {}},
      {"id": "emotional_timeline", "title": "Emotional Timeline", "type": "timeline", "config": {}},
      {"id": "crisis_events", "title": "Crisis Events & Triggers", "type": "alert", "config": {}},
      {"id": "voice_transcripts", "title": "Selected Voice Entries", "type": "transcripts", "config": {"limit": 10}},
      {"id": "activities_engagement", "title": "Activities Engagement", "type": "stats", "config": {}},
      {"id": "goals_tracking", "title": "Goals Tracking", "type": "detailed", "config": {}},
      {"id": "safety_plan", "title": "Safety Plan", "type": "plan", "config": {}}
    ]'::jsonb,
    30
  );

SELECT '✅ Phase 6 Week 2: Wellness reports tables created!' as message;
SELECT 'Report templates seeded: ' || COUNT(*) as count FROM report_templates;
