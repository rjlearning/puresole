-- Create ONLY Phase 5 tables (no modifications to existing tables)
-- Run this if drizzle-kit push fails

CREATE TABLE IF NOT EXISTS wellness_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  plan_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  target_date TIMESTAMP NOT NULL,
  generated_by VARCHAR(50) DEFAULT 'ai',

  reasoning TEXT,
  priority_focus VARCHAR(100),

  baseline_mood_score INTEGER,
  baseline_stress_level INTEGER,
  baseline_energy_level INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plan_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  plan_id VARCHAR NOT NULL REFERENCES wellness_plans(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  item_type VARCHAR(50) NOT NULL,

  activity_id VARCHAR,

  scheduled_time VARCHAR(5),
  estimated_duration INTEGER,
  display_order INTEGER DEFAULT 0,

  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP,
  effectiveness_rating INTEGER,
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_goals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  goal_type VARCHAR(50) NOT NULL,
  category VARCHAR(50),

  target_metric VARCHAR(100),
  target_value DECIMAL(10, 2),
  current_value DECIMAL(10, 2) DEFAULT 0,
  unit VARCHAR(50),

  start_date TIMESTAMP NOT NULL,
  target_date TIMESTAMP NOT NULL,

  status VARCHAR(50) NOT NULL DEFAULT 'active',
  completion_percentage DECIMAL(5, 2) DEFAULT 0,

  why_important TEXT,
  reward TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goal_progress (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  goal_id VARCHAR NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,

  recorded_at TIMESTAMP DEFAULT NOW(),
  value DECIMAL(10, 2) NOT NULL,
  percentage DECIMAL(5, 2),

  note TEXT,
  mood_at_recording INTEGER
);

CREATE TABLE IF NOT EXISTS wellness_insights (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  insight_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  data_source VARCHAR(50),
  confidence_score DECIMAL(3, 2),

  is_actionable BOOLEAN DEFAULT false,
  recommended_action TEXT,
  priority VARCHAR(20) DEFAULT 'medium',

  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,

  relevant_from TIMESTAMP DEFAULT NOW(),
  relevant_until TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  recommendation_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  activity_id VARCHAR,

  reasoning TEXT,
  expected_benefit TEXT,

  confidence_score DECIMAL(3, 2),
  based_on JSONB,

  status VARCHAR(50) DEFAULT 'pending',
  user_feedback TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  responded_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wellness_plans_user_target ON wellness_plans(user_id, target_date);
CREATE INDEX IF NOT EXISTS idx_wellness_plans_status ON wellness_plans(status);
CREATE INDEX IF NOT EXISTS idx_plan_items_plan_order ON plan_items(plan_id, display_order);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_status ON user_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal_recorded ON goal_progress(goal_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_wellness_insights_user_priority ON wellness_insights(user_id, priority, is_read);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_status ON recommendations(user_id, status);

SELECT 'Phase 5 tables created successfully!' as message;
