-- Phase 2: Emotional Blueprints (Fixed for VARCHAR IDs)

CREATE TABLE IF NOT EXISTS emotional_blueprints (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  stress_score INTEGER,
  anxiety_score INTEGER,
  mood_score INTEGER,
  sleep_quality INTEGER,
  energy_level INTEGER,
  detected_emotions TEXT[] DEFAULT '{}',
  insights TEXT[] DEFAULT '{}',
  wellness_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_blueprints_user_date ON emotional_blueprints(user_id, date DESC);

-- Add AI analysis columns to voice_entries (if they don't exist)
ALTER TABLE voice_entries ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE voice_entries ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}';
ALTER TABLE voice_entries ADD COLUMN IF NOT EXISTS prosody_data JSONB DEFAULT '{}';
ALTER TABLE voice_entries ADD COLUMN IF NOT EXISTS crisis_assessment JSONB DEFAULT '{}';

-- Analysis jobs table
CREATE TABLE IF NOT EXISTS analysis_jobs (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  entry_id VARCHAR(255) NOT NULL REFERENCES voice_entries(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_entry ON analysis_jobs(entry_id);
