-- Migration: Goals & Progress Tracking System (Enhancements)
-- Adds milestones, reminders, check-ins, and templates to existing goals system

-- Note: user_goals and goal_progress tables already exist
-- This migration adds supporting tables for enhanced goal tracking

-- Ensure user_goals table exists with required fields
CREATE TABLE IF NOT EXISTS user_goals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  goal_type VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  target_metric VARCHAR(100),
  target_value INTEGER,
  current_value INTEGER DEFAULT 0,
  unit VARCHAR(50),
  start_date DATE DEFAULT CURRENT_DATE,
  target_date DATE NOT NULL,
  why_important TEXT,
  reward TEXT,
  status VARCHAR(20) DEFAULT 'active',
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure goal_progress table exists
CREATE TABLE IF NOT EXISTS goal_progress (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  goal_id VARCHAR NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
  value INTEGER NOT NULL,
  percentage DECIMAL(5,2),
  note TEXT,
  mood_at_recording INTEGER,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Goal progress tracking
CREATE TABLE IF NOT EXISTS goal_progress (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  goal_id VARCHAR NOT NULL REFERENCES wellness_goals(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  value INTEGER NOT NULL, -- progress for that day
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Goal milestones (NEW)
CREATE TABLE IF NOT EXISTS goal_milestones (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  goal_id VARCHAR NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_value INTEGER NOT NULL,
  achieved BOOLEAN DEFAULT false,
  achieved_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Goal reminders (NEW)
CREATE TABLE IF NOT EXISTS goal_reminders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  goal_id VARCHAR NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
  reminder_time TIME NOT NULL,
  reminder_days VARCHAR(50) NOT NULL, -- JSON array: ["monday", "tuesday"]
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Goal check-ins (NEW)
CREATE TABLE IF NOT EXISTS goal_checkins (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  goal_id VARCHAR NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  progress_rating INTEGER CHECK (progress_rating >= 1 AND progress_rating <= 5),
  challenges TEXT,
  wins TEXT,
  adjustments_needed TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Goal templates (pre-defined goals)
CREATE TABLE IF NOT EXISTS goal_templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  goal_type VARCHAR(50) NOT NULL,
  target_value INTEGER,
  target_metric VARCHAR(100),
  suggested_duration_days INTEGER,
  tips TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_goals_user ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON user_goals(status);
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal ON goal_progress(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_recorded ON goal_progress(recorded_at);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal ON goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_checkins_goal ON goal_checkins(goal_id);

-- Insert sample goal templates
INSERT INTO goal_templates (title, description, category, goal_type, target_value, target_metric, suggested_duration_days, tips, is_featured) VALUES
('Daily Mood Tracking', 'Log your mood every day to identify patterns and triggers', 'mood', 'daily', 1, 'mood entries', 30, 'Set a reminder for the same time each day. Be honest about your emotions.', true),
('Weekly Exercise Goal', 'Complete at least 3 exercise activities per week', 'activity', 'weekly', 3, 'exercise activities', 90, 'Start small and gradually increase. Any movement counts!', true),
('Medication Adherence', 'Take all prescribed medications as scheduled', 'medication', 'daily', 100, 'adherence percentage', 30, 'Set reminders. Keep medications visible. Track side effects.', true),
('Therapy Consistency', 'Attend all scheduled therapy sessions', 'therapy', 'monthly', 4, 'sessions attended', 90, 'Schedule sessions in advance. Prepare topics beforehand.', false),
('Better Sleep Schedule', 'Get 7-8 hours of sleep per night', 'sleep', 'daily', 7, 'hours of sleep', 30, 'Create a bedtime routine. Avoid screens 1 hour before bed.', true),
('Social Connection', 'Connect with friends or family 2+ times per week', 'social', 'weekly', 2, 'social interactions', 60, 'Schedule regular calls or meetups. Quality over quantity.', false),
('Mindfulness Practice', 'Practice mindfulness or meditation daily', 'activity', 'daily', 1, 'mindfulness sessions', 21, 'Start with just 5 minutes. Use guided meditations if helpful.', true),
('Stress Management', 'Use at least one coping strategy when feeling stressed', 'mood', 'daily', 1, 'coping strategies used', 30, 'Keep a list of your favorite strategies handy.', false);

SELECT 'Migration 015_goals_tracking.sql completed successfully' as result;
