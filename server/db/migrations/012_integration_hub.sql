-- Phase 8 Feature 4: Integration Hub
-- Creates tables for external integrations, data imports, and sync management

-- Integrations (connections to external services)
CREATE TABLE IF NOT EXISTS integrations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'fitbit', 'apple_health', 'google_fit', 'strava', 'withings'
  provider_user_id VARCHAR(255), -- User ID from the external provider
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  sync_frequency VARCHAR(50) DEFAULT 'daily', -- 'realtime', 'hourly', 'daily', 'manual'
  auto_sync_enabled BOOLEAN DEFAULT true,
  connected_at TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{}', -- Provider-specific settings
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integrations_user
  ON integrations(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_integrations_provider
  ON integrations(provider, is_active);

CREATE INDEX IF NOT EXISTS idx_integrations_sync_due
  ON integrations(last_sync_at, auto_sync_enabled) WHERE is_active = true;

-- Imported Data (data synced from external sources)
CREATE TABLE IF NOT EXISTS imported_data (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  integration_id VARCHAR NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  data_type VARCHAR(50) NOT NULL, -- 'sleep', 'steps', 'heart_rate', 'exercise', 'weight', 'mood'
  data JSONB NOT NULL, -- Flexible structure for different data types
  recorded_at TIMESTAMP NOT NULL, -- When the data was originally recorded
  imported_at TIMESTAMP DEFAULT NOW(), -- When we imported it
  external_id VARCHAR(255), -- ID from external provider (for deduplication)
  UNIQUE(integration_id, data_type, external_id)
);

CREATE INDEX IF NOT EXISTS idx_imported_data_user_type
  ON imported_data(user_id, data_type, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_imported_data_integration
  ON imported_data(integration_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_imported_data_recorded_at
  ON imported_data(recorded_at DESC);

-- Sync Logs (tracking sync operations)
CREATE TABLE IF NOT EXISTS sync_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  integration_id VARCHAR NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL, -- 'manual', 'scheduled', 'realtime'
  status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  data_types_synced TEXT[], -- Which data types were synced
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INTEGER, -- How long the sync took
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_integration
  ON sync_logs(integration_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_logs_status
  ON sync_logs(status, created_at DESC);

-- Integration Data Mappings (map external data to our internal structures)
CREATE TABLE IF NOT EXISTS integration_mappings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  integration_id VARCHAR NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  external_field VARCHAR(255) NOT NULL,
  internal_field VARCHAR(255) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  transformation_rule JSONB, -- Rules for transforming data (e.g., unit conversions)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_mappings_integration
  ON integration_mappings(integration_id, is_active);

-- Integration Webhooks (for realtime updates from providers)
CREATE TABLE IF NOT EXISTS integration_webhooks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  integration_id VARCHAR NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  webhook_url VARCHAR(500) NOT NULL,
  webhook_secret VARCHAR(255),
  event_types TEXT[] NOT NULL, -- Which events to listen for
  is_active BOOLEAN DEFAULT true,
  last_received_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_webhooks_integration
  ON integration_webhooks(integration_id, is_active);

-- Sync Schedule (for managing automatic sync timing)
CREATE TABLE IF NOT EXISTS sync_schedule (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  integration_id VARCHAR NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  schedule_type VARCHAR(50) NOT NULL, -- 'cron', 'interval'
  schedule_config JSONB NOT NULL, -- Cron expression or interval config
  next_run_at TIMESTAMP,
  last_run_at TIMESTAMP,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_schedule_next_run
  ON sync_schedule(next_run_at, is_enabled) WHERE is_enabled = true;

-- Data Correlation Cache (pre-computed correlations between imported data and mood)
CREATE TABLE IF NOT EXISTS data_correlations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_type VARCHAR(50) NOT NULL,
  correlation_with VARCHAR(50) NOT NULL, -- 'mood', 'energy', 'stress'
  correlation_coefficient DECIMAL(4,3), -- -1.000 to 1.000
  confidence_level DECIMAL(3,2), -- 0.00 to 1.00
  sample_size INTEGER,
  time_period VARCHAR(50), -- 'week', 'month', 'quarter'
  calculated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  insights TEXT,
  UNIQUE(user_id, data_type, correlation_with, time_period)
);

CREATE INDEX IF NOT EXISTS idx_data_correlations_user
  ON data_correlations(user_id, calculated_at DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_integration_hub_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integrations_updated_at_trigger
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_hub_updated_at();

CREATE TRIGGER integration_mappings_updated_at_trigger
  BEFORE UPDATE ON integration_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_hub_updated_at();

CREATE TRIGGER integration_webhooks_updated_at_trigger
  BEFORE UPDATE ON integration_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_hub_updated_at();

CREATE TRIGGER sync_schedule_updated_at_trigger
  BEFORE UPDATE ON sync_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_hub_updated_at();

-- Function to update last_sync_at after successful sync
CREATE OR REPLACE FUNCTION update_integration_last_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' OR NEW.status = 'partial' THEN
    UPDATE integrations
    SET last_sync_at = NEW.completed_at
    WHERE id = NEW.integration_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_logs_update_last_sync_trigger
  AFTER INSERT ON sync_logs
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION update_integration_last_sync();
