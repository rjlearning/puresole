-- Migration: Flexible Entry System (Airtable-inspired)
-- This migration creates the foundation for flexible, customizable mental health tracking

-- Main entries table with flexible JSONB data
CREATE TABLE IF NOT EXISTS entries (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_type VARCHAR(50) NOT NULL, -- mood, activity, sleep, journal, symptom, medication, etc.
  title VARCHAR(255),
  content TEXT,
  data JSONB NOT NULL DEFAULT '{}', -- Flexible data storage
  mood_score INTEGER CHECK (mood_score >= 0 AND mood_score <= 100),
  energy_level INTEGER CHECK (energy_level >= 0 AND energy_level <= 100),
  stress_level INTEGER CHECK (stress_level >= 0 AND stress_level <= 100),
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]', -- Array of {type, url, name} objects
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Custom fields definition table
CREATE TABLE IF NOT EXISTS custom_fields (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  field_type VARCHAR(50) NOT NULL, -- text, number, select, multiselect, date, checkbox, rating
  entry_types TEXT[] DEFAULT '{}', -- Which entry types this field applies to
  options JSONB DEFAULT '[]', -- For select/multiselect fields
  validation JSONB DEFAULT '{}', -- {min, max, required, pattern, etc.}
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, field_name)
);

-- Insights and patterns table (extends existing insights)
CREATE TABLE IF NOT EXISTS flexible_insights (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL, -- pattern, correlation, trend, suggestion, alert
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'info', -- info, warning, critical
  data JSONB NOT NULL DEFAULT '{}', -- Pattern details, correlation data, etc.
  related_entry_ids JSONB DEFAULT '[]'::jsonb,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status VARCHAR(20) DEFAULT 'active', -- active, dismissed, archived
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  dismissed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Relationships between entries (e.g., "symptom X correlates with activity Y")
CREATE TABLE IF NOT EXISTS entry_relationships (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_entry_id VARCHAR NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  to_entry_id VARCHAR NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL, -- triggers, correlates, follows, precedes
  strength DECIMAL(3,2) CHECK (strength >= 0 AND strength <= 1), -- 0-1 correlation strength
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(from_entry_id, to_entry_id, relationship_type)
);

-- Templates for common entry patterns
CREATE TABLE IF NOT EXISTS entry_templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE, -- NULL for global templates
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entry_type VARCHAR(50) NOT NULL,
  is_global BOOLEAN DEFAULT FALSE,
  template_data JSONB NOT NULL DEFAULT '{}', -- Default values and structure
  icon VARCHAR(50),
  color VARCHAR(50),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_entry_type ON entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_entries_recorded_at ON entries(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_user_type_date ON entries(user_id, entry_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_data_gin ON entries USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_entries_tags_gin ON entries USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_entries_deleted_at ON entries(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_custom_fields_user_id ON custom_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_entry_types ON custom_fields USING GIN (entry_types);

CREATE INDEX IF NOT EXISTS idx_flexible_insights_user_id ON flexible_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_flexible_insights_status ON flexible_insights(status);
CREATE INDEX IF NOT EXISTS idx_flexible_insights_type ON flexible_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_flexible_insights_created_at ON flexible_insights(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_relationships_user_id ON entry_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_from_entry ON entry_relationships(from_entry_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to_entry ON entry_relationships(to_entry_id);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON entry_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_entry_type ON entry_templates(entry_type);
CREATE INDEX IF NOT EXISTS idx_templates_global ON entry_templates(is_global) WHERE is_global = TRUE;

-- Insert some default global templates
INSERT INTO entry_templates (name, description, entry_type, is_global, template_data, icon, color) VALUES
  ('Quick Mood Check', 'Fast mood tracking with energy and stress', 'mood', TRUE,
   '{"prompts": ["How are you feeling?", "Energy level?", "Stress level?"], "fields": ["mood_score", "energy_level", "stress_level"]}',
   'Smile', 'purple'),

  ('Sleep Log', 'Track your sleep quality and duration', 'sleep', TRUE,
   '{"fields": ["sleep_duration", "sleep_quality", "dreams", "woke_up_feeling"], "suggestions": ["Add bedtime routine", "Note any disturbances"]}',
   'Moon', 'indigo'),

  ('Anxiety Episode', 'Record anxiety symptoms and triggers', 'symptom', TRUE,
   '{"fields": ["severity", "physical_symptoms", "triggers", "coping_strategies"], "tags": ["anxiety"]}',
   'AlertCircle', 'red'),

  ('Gratitude Journal', 'Three things you''re grateful for', 'journal', TRUE,
   '{"prompts": ["What are 3 things you''re grateful for today?"], "fields": ["gratitude_items"], "tags": ["gratitude", "positive"]}',
   'Heart', 'pink'),

  ('Medication Taken', 'Log medication adherence', 'medication', TRUE,
   '{"fields": ["medication_name", "dosage", "time_taken", "side_effects"], "tags": ["medication"]}',
   'Pill', 'teal'),

  ('Exercise & Movement', 'Track physical activity', 'activity', TRUE,
   '{"fields": ["activity_type", "duration", "intensity", "how_felt"], "tags": ["exercise"]}',
   'Activity', 'green');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_entries_updated_at BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON entry_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for entry analytics
CREATE OR REPLACE VIEW entry_analytics AS
SELECT
  user_id,
  entry_type,
  DATE(recorded_at) as entry_date,
  COUNT(*) as entry_count,
  AVG(mood_score) as avg_mood,
  AVG(energy_level) as avg_energy,
  AVG(stress_level) as avg_stress
FROM entries
WHERE deleted_at IS NULL
GROUP BY user_id, entry_type, DATE(recorded_at);

COMMENT ON TABLE entries IS 'Flexible entry system - stores all user mental health data with JSONB for extensibility';
COMMENT ON TABLE custom_fields IS 'User-defined custom fields for personalizing their tracking';
COMMENT ON TABLE flexible_insights IS 'AI-generated insights, patterns, and suggestions (extends base insights)';
COMMENT ON TABLE entry_relationships IS 'Tracks correlations and relationships between different entries';
COMMENT ON TABLE entry_templates IS 'Templates for quick entry creation';
