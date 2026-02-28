-- Migration: Views System (Airtable-inspired)
-- This migration creates the infrastructure for multiple views of the same data

-- Views configuration table
CREATE TABLE IF NOT EXISTS views (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_name VARCHAR(50) NOT NULL,  -- 'entries', 'goals', 'insights', etc.
  name VARCHAR(255) NOT NULL,
  view_type VARCHAR(20) NOT NULL,   -- 'grid', 'calendar', 'gallery', 'kanban', 'timeline'

  -- View configuration
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  filters JSONB DEFAULT '[]'::jsonb,       -- Applied filters
  sorts JSONB DEFAULT '[]'::jsonb,         -- Sort configuration
  visible_fields JSONB DEFAULT '[]'::jsonb, -- Which fields to show
  group_by VARCHAR(100),                    -- Group by field

  -- View metadata
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, table_name, name)
);

-- View sharing table
CREATE TABLE IF NOT EXISTS view_shares (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  view_id VARCHAR NOT NULL REFERENCES views(id) ON DELETE CASCADE,
  share_token VARCHAR(32) UNIQUE NOT NULL,
  permission VARCHAR(10) DEFAULT 'view',  -- 'view', 'edit'
  password_hash VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Access tracking
  view_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by VARCHAR NOT NULL REFERENCES users(id)
);

-- Field metadata table (extends custom_fields with display info)
CREATE TABLE IF NOT EXISTS field_metadata (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id VARCHAR NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,

  -- Display configuration
  width INTEGER DEFAULT 150,           -- Column width in pixels
  is_frozen BOOLEAN DEFAULT false,     -- Freeze column in grid
  is_hidden BOOLEAN DEFAULT false,     -- Hide column
  description TEXT,                    -- Help text

  -- Computed fields
  formula TEXT,                        -- Formula for computed fields
  formula_type VARCHAR(20),            -- 'number', 'text', 'date', etc.

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(field_id)
);

-- View access log (for analytics)
CREATE TABLE IF NOT EXISTS view_access_log (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  view_id VARCHAR NOT NULL REFERENCES views(id) ON DELETE CASCADE,
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  share_token VARCHAR(32),
  access_type VARCHAR(20) NOT NULL,    -- 'view', 'edit', 'export'
  ip_address VARCHAR(50),
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_views_user_id ON views(user_id);
CREATE INDEX IF NOT EXISTS idx_views_table_name ON views(table_name);
CREATE INDEX IF NOT EXISTS idx_views_user_table ON views(user_id, table_name);
CREATE INDEX IF NOT EXISTS idx_views_is_default ON views(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_views_is_favorite ON views(is_favorite) WHERE is_favorite = true;

CREATE INDEX IF NOT EXISTS idx_view_shares_token ON view_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_view_shares_view_id ON view_shares(view_id);
CREATE INDEX IF NOT EXISTS idx_view_shares_expires ON view_shares(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_field_metadata_field_id ON field_metadata(field_id);

CREATE INDEX IF NOT EXISTS idx_view_access_view_id ON view_access_log(view_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_view_access_user_id ON view_access_log(user_id, accessed_at DESC) WHERE user_id IS NOT NULL;

-- Trigger for updated_at on views
CREATE TRIGGER update_views_updated_at
  BEFORE UPDATE ON views
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_field_metadata_updated_at
  BEFORE UPDATE ON field_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate share tokens
CREATE OR REPLACE FUNCTION generate_share_token() RETURNS VARCHAR AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Insert default views for entries table
INSERT INTO views (user_id, table_name, name, view_type, description, is_default, config, visible_fields)
SELECT
  id as user_id,
  'entries' as table_name,
  'All Entries' as name,
  'grid' as view_type,
  'Default spreadsheet view of all your entries' as description,
  true as is_default,
  '{}'::jsonb as config,
  '["entryType", "title", "moodScore", "energyLevel", "stressLevel", "tags", "recordedAt"]'::jsonb as visible_fields
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM views WHERE views.user_id = users.id AND views.table_name = 'entries'
);

INSERT INTO views (user_id, table_name, name, view_type, description, config, visible_fields)
SELECT
  id as user_id,
  'entries' as table_name,
  'Calendar' as name,
  'calendar' as view_type,
  'Monthly calendar view of your mood entries' as description,
  '{"dateField": "recordedAt", "colorBy": "moodScore"}'::jsonb as config,
  '["title", "moodScore", "energyLevel"]'::jsonb as visible_fields
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM views
  WHERE views.user_id = users.id
  AND views.table_name = 'entries'
  AND views.name = 'Calendar'
);

INSERT INTO views (user_id, table_name, name, view_type, description, filters, config)
SELECT
  id as user_id,
  'entries' as table_name,
  'This Week' as name,
  'grid' as view_type,
  'Entries from the past 7 days' as description,
  '[{"field": "recordedAt", "operator": ">=", "value": "NOW() - INTERVAL ''7 days''"}]'::jsonb as filters,
  '{}'::jsonb as config
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM views
  WHERE views.user_id = users.id
  AND views.table_name = 'entries'
  AND views.name = 'This Week'
);

-- Comments
COMMENT ON TABLE views IS 'User-defined views for different visualizations of mental health data';
COMMENT ON TABLE view_shares IS 'Sharing configuration for views (therapists, family)';
COMMENT ON TABLE field_metadata IS 'Display and formatting configuration for custom fields';
COMMENT ON TABLE view_access_log IS 'Audit log for view access';

COMMENT ON COLUMN views.table_name IS 'Which base table this view displays (entries, goals, etc.)';
COMMENT ON COLUMN views.view_type IS 'Visualization type: grid, calendar, gallery, kanban, timeline';
COMMENT ON COLUMN views.config IS 'View-specific configuration (calendar date field, gallery cover field, etc.)';
COMMENT ON COLUMN views.filters IS 'Array of filter conditions applied to this view';
COMMENT ON COLUMN views.sorts IS 'Array of sort configuration';
COMMENT ON COLUMN views.visible_fields IS 'Which fields to display in this view';
COMMENT ON COLUMN views.group_by IS 'Field to group entries by (for kanban, grouped grid, etc.)';
