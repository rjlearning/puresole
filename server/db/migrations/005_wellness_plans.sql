-- ============================================
-- Phase 5: Personalized Wellness Plans Migration
-- ============================================
-- Features:
-- - AI-generated daily/weekly wellness plans
-- - User goal setting and tracking
-- - Personalized insights and recommendations
-- - Adaptive AI that learns from user behavior
-- ============================================

-- Wellness Plans Table
CREATE TABLE IF NOT EXISTS wellness_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Plan details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('daily', 'weekly', 'custom')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'skipped', 'archived')),
  target_date DATE NOT NULL,
  generated_by VARCHAR(50) DEFAULT 'ai' CHECK (generated_by IN ('ai', 'user', 'therapist')),

  -- AI reasoning
  reasoning TEXT,
  priority_focus VARCHAR(100),

  -- Baseline metrics at plan creation
  baseline_mood_score INTEGER CHECK (baseline_mood_score BETWEEN 0 AND 100),
  baseline_stress_level INTEGER CHECK (baseline_stress_level BETWEEN 0 AND 100),
  baseline_energy_level INTEGER CHECK (baseline_energy_level BETWEEN 0 AND 100),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_wellness_plans_user_target ON wellness_plans(user_id, target_date);
CREATE INDEX idx_wellness_plans_status ON wellness_plans(status);
CREATE INDEX idx_wellness_plans_user_status ON wellness_plans(user_id, status);

-- Plan Items Table (individual tasks in a plan)
CREATE TABLE IF NOT EXISTS plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES wellness_plans(id) ON DELETE CASCADE,

  -- Item details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('activity', 'reminder', 'reflection', 'custom')),

  -- Reference to existing activity (optional)
  activity_id UUID REFERENCES wellness_activities(id) ON DELETE SET NULL,

  -- Scheduling
  scheduled_time TIME,
  estimated_duration INTEGER, -- minutes
  display_order INTEGER DEFAULT 0,

  -- Completion tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  completed_at TIMESTAMP,
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_plan_items_plan_order ON plan_items(plan_id, display_order);
CREATE INDEX idx_plan_items_status ON plan_items(status);
CREATE INDEX idx_plan_items_plan_status ON plan_items(plan_id, status);

-- User Goals Table
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Goal details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('habit', 'milestone', 'metric', 'challenge')),
  category VARCHAR(50) CHECK (category IN ('mental_health', 'sleep', 'exercise', 'mindfulness', 'social', 'other')),

  -- Target metrics
  target_metric VARCHAR(100),
  target_value DECIMAL(10, 2),
  current_value DECIMAL(10, 2) DEFAULT 0,
  unit VARCHAR(50),

  -- Timeframe
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'paused')),
  completion_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),

  -- Motivation
  why_important TEXT,
  reward TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_user_goals_user_status ON user_goals(user_id, status);
CREATE INDEX idx_user_goals_target_date ON user_goals(target_date);
CREATE INDEX idx_user_goals_user_category ON user_goals(user_id, category);

-- Goal Progress Tracking Table
CREATE TABLE IF NOT EXISTS goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,

  -- Progress snapshot
  recorded_at TIMESTAMP DEFAULT NOW(),
  value DECIMAL(10, 2) NOT NULL,
  percentage DECIMAL(5, 2),

  -- Context
  note TEXT,
  mood_at_recording INTEGER CHECK (mood_at_recording BETWEEN 1 AND 10)
);

CREATE INDEX idx_goal_progress_goal_recorded ON goal_progress(goal_id, recorded_at);

-- Wellness Insights Table (AI-generated insights)
CREATE TABLE IF NOT EXISTS wellness_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Insight details
  insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('pattern', 'achievement', 'warning', 'suggestion')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  -- Supporting data
  data_source VARCHAR(50) CHECK (data_source IN ('voice_entries', 'activities', 'mood_tracking', 'goals', 'combined')),
  confidence_score DECIMAL(3, 2) CHECK (confidence_score BETWEEN 0 AND 1),

  -- Actionability
  is_actionable BOOLEAN DEFAULT false,
  recommended_action TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- User interaction
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,

  -- Time relevance
  relevant_from DATE DEFAULT CURRENT_DATE,
  relevant_until DATE,

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wellness_insights_user_priority ON wellness_insights(user_id, priority, is_read);
CREATE INDEX idx_wellness_insights_user_created ON wellness_insights(user_id, created_at DESC);
CREATE INDEX idx_wellness_insights_actionable ON wellness_insights(user_id, is_actionable, is_read) WHERE is_actionable = true;

-- Recommendations Table (personalized suggestions)
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Recommendation details
  recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('activity', 'habit', 'resource', 'goal')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  -- Optional reference to activity
  activity_id UUID REFERENCES wellness_activities(id) ON DELETE CASCADE,

  -- AI reasoning
  reasoning TEXT,
  expected_benefit TEXT,

  -- Personalization
  confidence_score DECIMAL(3, 2) CHECK (confidence_score BETWEEN 0 AND 1),
  based_on TEXT[], -- Array of factors

  -- User response
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  user_feedback TEXT,

  -- Timing
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  responded_at TIMESTAMP
);

CREATE INDEX idx_recommendations_user_status ON recommendations(user_id, status);
CREATE INDEX idx_recommendations_created ON recommendations(created_at DESC);
CREATE INDEX idx_recommendations_user_pending ON recommendations(user_id, status) WHERE status = 'pending';

-- ============================================
-- Helper Functions
-- ============================================

-- Function to update goal completion percentage
CREATE OR REPLACE FUNCTION update_goal_percentage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target_value > 0 THEN
    NEW.completion_percentage := (NEW.current_value / NEW.target_value * 100);

    -- Cap at 100%
    IF NEW.completion_percentage > 100 THEN
      NEW.completion_percentage := 100;
    END IF;

    -- Auto-complete if target reached
    IF NEW.completion_percentage >= 100 AND NEW.status = 'active' THEN
      NEW.status := 'completed';
      NEW.completed_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goal_percentage
  BEFORE UPDATE OF current_value, target_value ON user_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_percentage();

-- Function to auto-update plan status when all items complete
CREATE OR REPLACE FUNCTION update_plan_status()
RETURNS TRIGGER AS $$
DECLARE
  total_items INTEGER;
  completed_items INTEGER;
BEGIN
  -- Count items in the plan
  SELECT COUNT(*) INTO total_items
  FROM plan_items
  WHERE plan_id = NEW.plan_id;

  -- Count completed items
  SELECT COUNT(*) INTO completed_items
  FROM plan_items
  WHERE plan_id = NEW.plan_id AND status = 'completed';

  -- If all items completed, mark plan as completed
  IF total_items > 0 AND completed_items = total_items THEN
    UPDATE wellness_plans
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE id = NEW.plan_id AND status != 'completed';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_plan_status
  AFTER INSERT OR UPDATE OF status ON plan_items
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_status();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wellness_plans_updated_at
  BEFORE UPDATE ON wellness_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_plan_items_updated_at
  BEFORE UPDATE ON plan_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- This section is commented out by default
-- Uncomment to insert sample data for testing

/*
-- Sample wellness plan
INSERT INTO wellness_plans (user_id, title, description, plan_type, target_date, reasoning, priority_focus)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Morning Stress Relief Plan',
  'A gentle morning routine to start your day with calm and focus',
  'daily',
  CURRENT_DATE,
  'Based on recent elevated stress levels (avg: 72/100) and morning anxiety patterns',
  'stress_reduction'
);

-- Sample plan items
INSERT INTO plan_items (plan_id, title, description, item_type, scheduled_time, estimated_duration, display_order)
VALUES
  ((SELECT id FROM wellness_plans ORDER BY created_at DESC LIMIT 1), 'Morning Meditation', 'Start with 10 minutes of guided meditation', 'activity', '08:00', 10, 1),
  ((SELECT id FROM wellness_plans ORDER BY created_at DESC LIMIT 1), 'Gratitude Journaling', 'Write down 3 things you''re grateful for', 'activity', '08:15', 5, 2),
  ((SELECT id FROM wellness_plans ORDER BY created_at DESC LIMIT 1), 'Gentle Stretching', 'Light stretching to energize your body', 'activity', '08:25', 10, 3);

-- Sample goal
INSERT INTO user_goals (user_id, title, description, goal_type, category, target_metric, target_value, unit, start_date, target_date, why_important)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Complete 20 wellness activities this month',
  'Build a consistent self-care practice',
  'metric',
  'mental_health',
  'activities_completed',
  20,
  'count',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'I want to prioritize my mental health and build healthy habits'
);
*/

-- ============================================
-- Verification Queries
-- ============================================

-- Run these to verify the migration worked:

-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('wellness_plans', 'plan_items', 'user_goals', 'goal_progress', 'wellness_insights', 'recommendations')
ORDER BY table_name;

-- Check triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('wellness_plans', 'plan_items', 'user_goals')
ORDER BY event_object_table, trigger_name;
