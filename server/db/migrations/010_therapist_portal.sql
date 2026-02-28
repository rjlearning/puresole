-- Phase 8 Feature 2: Therapist/Professional Portal
-- Creates tables for therapist profiles, client relationships, and session management

-- Therapist Profiles
CREATE TABLE IF NOT EXISTS therapist_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number VARCHAR(100),
  license_type VARCHAR(100), -- 'LCSW', 'PhD', 'PsyD', 'LMFT', 'LPC', etc.
  specialization TEXT[], -- ['anxiety', 'depression', 'trauma', 'couples']
  bio TEXT,
  credentials TEXT, -- Education, certifications, years of experience
  years_experience INTEGER,
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP,
  accepts_new_clients BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  session_duration INTEGER DEFAULT 60, -- minutes
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_therapist_profiles_user
  ON therapist_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_therapist_profiles_verified
  ON therapist_profiles(verified, accepts_new_clients);

-- Client-Therapist Relationships
CREATE TABLE IF NOT EXISTS client_therapist_relationships (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  therapist_id VARCHAR NOT NULL REFERENCES therapist_profiles(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'ended', 'paused'
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  termination_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, therapist_id, status)
);

CREATE INDEX IF NOT EXISTS idx_client_therapist_relationships_client
  ON client_therapist_relationships(client_id, status);

CREATE INDEX IF NOT EXISTS idx_client_therapist_relationships_therapist
  ON client_therapist_relationships(therapist_id, status);

-- Therapy Sessions
CREATE TABLE IF NOT EXISTS therapy_sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  relationship_id VARCHAR NOT NULL REFERENCES client_therapist_relationships(id) ON DELETE CASCADE,
  session_date TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL, -- minutes
  session_type VARCHAR(50) DEFAULT 'individual', -- 'individual', 'couples', 'group', 'family'
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no_show'
  cancellation_reason TEXT,
  client_mood_before INTEGER, -- 1-10
  client_mood_after INTEGER, -- 1-10
  therapist_notes TEXT,
  treatment_modality VARCHAR(100), -- 'CBT', 'DBT', 'EMDR', 'psychodynamic', etc.
  next_session_date TIMESTAMP,
  homework_assigned TEXT,
  progress_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_relationship
  ON therapy_sessions(relationship_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_date
  ON therapy_sessions(session_date, status);

-- Session Notes (for detailed note-taking during sessions)
CREATE TABLE IF NOT EXISTS session_notes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id VARCHAR NOT NULL REFERENCES therapy_sessions(id) ON DELETE CASCADE,
  note_type VARCHAR(50) NOT NULL, -- 'progress', 'concern', 'intervention', 'assessment', 'goal'
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT true, -- If false, client can view
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_notes_session
  ON session_notes(session_id, created_at DESC);

-- Client Treatment Goals
CREATE TABLE IF NOT EXISTS treatment_goals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  relationship_id VARCHAR NOT NULL REFERENCES client_therapist_relationships(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  category VARCHAR(50), -- 'behavioral', 'emotional', 'cognitive', 'relational'
  target_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'achieved', 'revised', 'discontinued'
  progress_percentage INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treatment_goals_relationship
  ON treatment_goals(relationship_id, status);

-- Session Reminders
CREATE TABLE IF NOT EXISTS session_reminders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id VARCHAR NOT NULL REFERENCES therapy_sessions(id) ON DELETE CASCADE,
  recipient_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'in_app'
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_reminders_scheduled
  ON session_reminders(scheduled_for, status);

-- Therapist Availability (for scheduling)
CREATE TABLE IF NOT EXISTS therapist_availability (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  therapist_id VARCHAR NOT NULL REFERENCES therapist_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_therapist_availability_therapist
  ON therapist_availability(therapist_id, day_of_week);

-- Client Progress Reports
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
);

CREATE INDEX IF NOT EXISTS idx_client_progress_reports_relationship
  ON client_progress_reports(relationship_id, created_at DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_therapist_portal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER therapist_profiles_updated_at_trigger
  BEFORE UPDATE ON therapist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_therapist_portal_updated_at();

CREATE TRIGGER client_therapist_relationships_updated_at_trigger
  BEFORE UPDATE ON client_therapist_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_therapist_portal_updated_at();

CREATE TRIGGER therapy_sessions_updated_at_trigger
  BEFORE UPDATE ON therapy_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_therapist_portal_updated_at();

CREATE TRIGGER session_notes_updated_at_trigger
  BEFORE UPDATE ON session_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_therapist_portal_updated_at();

CREATE TRIGGER treatment_goals_updated_at_trigger
  BEFORE UPDATE ON treatment_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_therapist_portal_updated_at();
