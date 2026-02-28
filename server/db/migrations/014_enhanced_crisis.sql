-- Phase 8 Feature 6: Enhanced Crisis Response System
-- Creates tables for crisis detection, intervention, safety plans, and support networks

-- Crisis Events (detected crisis situations)
CREATE TABLE IF NOT EXISTS crisis_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  crisis_type VARCHAR(100), -- 'suicidal_ideation', 'panic_attack', 'self_harm', 'substance_abuse'
  detected_by VARCHAR(50), -- 'ai_analysis', 'user_reported', 'voice_analysis', 'keyword_trigger'
  trigger_content TEXT,
  ai_assessment JSONB,
  user_mood_rating INTEGER,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'de-escalated', 'resolved', 'referred'
  intervention_taken VARCHAR(255),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crisis_events_user ON crisis_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_events_severity ON crisis_events(severity, status);
CREATE INDEX IF NOT EXISTS idx_crisis_events_status ON crisis_events(status, created_at DESC);

-- Safety Plans (personalized crisis response plans)
CREATE TABLE IF NOT EXISTS safety_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  warning_signs TEXT[],
  coping_strategies TEXT[],
  distractions TEXT[],
  support_contacts JSONB, -- Array of {name, phone, relationship}
  professional_contacts JSONB, -- Therapist, doctor contacts
  safe_environments TEXT[],
  things_to_live_for TEXT[],
  restrictions TEXT[], -- Items/places to avoid
  emergency_contacts JSONB,
  is_active BOOLEAN DEFAULT true,
  last_reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_plans_user ON safety_plans(user_id);

-- Crisis Interventions (actions taken during crisis)
CREATE TABLE IF NOT EXISTS crisis_interventions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  crisis_event_id VARCHAR NOT NULL REFERENCES crisis_events(id) ON DELETE CASCADE,
  intervention_type VARCHAR(100) NOT NULL, -- 'breathing_exercise', 'grounding', 'hotline_provided', 'emergency_contact_notified'
  content TEXT,
  was_effective BOOLEAN,
  user_feedback TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crisis_interventions_event ON crisis_interventions(crisis_event_id, created_at DESC);

-- Crisis Hotlines (emergency resources)
CREATE TABLE IF NOT EXISTS crisis_hotlines (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  country_code VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  sms_number VARCHAR(50),
  website VARCHAR(500),
  available_hours VARCHAR(100),
  languages TEXT[],
  specializations TEXT[], -- 'suicide', 'addiction', 'domestic_violence', 'lgbtq', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crisis_hotlines_country ON crisis_hotlines(country_code, is_active);

-- Emergency Contacts (user's designated emergency contacts)
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100),
  phone_number VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  priority INTEGER DEFAULT 1, -- 1=primary, 2=secondary, etc.
  can_notify_automatically BOOLEAN DEFAULT false,
  notification_preference VARCHAR(50) DEFAULT 'manual', -- 'automatic', 'ask_first', 'manual'
  notes TEXT,
  last_notified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON emergency_contacts(user_id, priority);

-- Crisis Check-ins (scheduled safety check-ins)
CREATE TABLE IF NOT EXISTS crisis_checkins (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'missed', 'escalated'
  mood_rating INTEGER,
  safety_rating INTEGER, -- 1-10, how safe does user feel
  needs_support BOOLEAN,
  response_content TEXT,
  escalated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crisis_checkins_user ON crisis_checkins(user_id, scheduled_for DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_checkins_scheduled ON crisis_checkins(scheduled_for, status);

-- Support Network (trusted people in user's support system)
CREATE TABLE IF NOT EXISTS support_network (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100),
  contact_method VARCHAR(100), -- 'phone', 'text', 'email', 'in_person'
  availability VARCHAR(255),
  support_type TEXT[], -- 'emotional', 'practical', 'crisis', 'medical'
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_network_user ON support_network(user_id, is_active);

-- Crisis Resources (educational resources and coping tools)
CREATE TABLE IF NOT EXISTS crisis_resources (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50) NOT NULL, -- 'article', 'video', 'exercise', 'worksheet', 'hotline'
  content TEXT,
  url VARCHAR(500),
  target_crisis_types TEXT[],
  estimated_duration_minutes INTEGER,
  difficulty_level VARCHAR(20), -- 'easy', 'moderate', 'advanced'
  effectiveness_rating DECIMAL(3,2), -- User ratings average
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crisis_resources_type ON crisis_resources(resource_type, is_featured);

-- User Resource Views (tracking which resources users access)
CREATE TABLE IF NOT EXISTS user_resource_views (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id VARCHAR NOT NULL REFERENCES crisis_resources(id) ON DELETE CASCADE,
  crisis_event_id VARCHAR REFERENCES crisis_events(id) ON DELETE SET NULL,
  was_helpful BOOLEAN,
  feedback TEXT,
  viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_resource_views_user ON user_resource_views(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_resource_views_resource ON user_resource_views(resource_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_crisis_system_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER safety_plans_updated_at_trigger
  BEFORE UPDATE ON safety_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_crisis_system_updated_at();

CREATE TRIGGER emergency_contacts_updated_at_trigger
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_crisis_system_updated_at();

CREATE TRIGGER support_network_updated_at_trigger
  BEFORE UPDATE ON support_network
  FOR EACH ROW
  EXECUTE FUNCTION update_crisis_system_updated_at();
