-- Phase IV: Advanced Analytics & Personalized Insights
-- Database Schema Migration
-- Creates tables for personalized baselines, predictions, and enhanced insights

-- =============================================================================
-- Table 1: Voice User Baselines
-- =============================================================================
-- Stores personalized emotion baselines for users at different time windows
-- Used for deviation detection and anomaly identification

CREATE TABLE IF NOT EXISTS voice_user_baselines (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Time window for baseline calculation
  window_days INTEGER NOT NULL CHECK (window_days IN (30, 60, 90)),

  -- Baseline metrics (VAD model)
  baseline_wellness_score DECIMAL(5,2) CHECK (baseline_wellness_score BETWEEN 0 AND 100),
  baseline_valence DECIMAL(4,2) CHECK (baseline_valence BETWEEN -1 AND 1),
  baseline_arousal DECIMAL(4,2) CHECK (baseline_arousal BETWEEN 0 AND 1),
  baseline_dominance DECIMAL(4,2) CHECK (baseline_dominance BETWEEN 0 AND 1),

  -- Statistical measures for deviation detection
  wellness_std_dev DECIMAL(5,2),
  valence_std_dev DECIMAL(4,2),
  arousal_std_dev DECIMAL(4,2),
  dominance_std_dev DECIMAL(4,2),

  -- Baseline quality indicators
  data_point_count INTEGER DEFAULT 0,
  baseline_confidence DECIMAL(3,2) CHECK (baseline_confidence BETWEEN 0 AND 1),

  -- Timestamps
  last_updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Metadata (for future extensibility)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  UNIQUE(user_id, window_days)
);

-- Indexes for baseline queries
CREATE INDEX idx_voice_baselines_user_window
  ON voice_user_baselines(user_id, window_days);
CREATE INDEX idx_voice_baselines_updated
  ON voice_user_baselines(last_updated_at DESC);
CREATE INDEX idx_voice_baselines_confidence
  ON voice_user_baselines(user_id, baseline_confidence DESC);

COMMENT ON TABLE voice_user_baselines IS 'Stores personalized emotion baselines for deviation detection';
COMMENT ON COLUMN voice_user_baselines.window_days IS '30, 60, or 90-day rolling window for baseline calculation';
COMMENT ON COLUMN voice_user_baselines.baseline_confidence IS 'Confidence score (0-1) based on data quality and quantity';

-- =============================================================================
-- Table 2: Voice Predictions
-- =============================================================================
-- Stores wellness forecasts with confidence intervals
-- Used for proactive wellness planning and early intervention

CREATE TABLE IF NOT EXISTS voice_predictions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Prediction details
  prediction_date DATE NOT NULL,
  prediction_window INTEGER NOT NULL CHECK (prediction_window IN (7, 14, 30)),

  -- Predicted values (VAD model)
  predicted_wellness_score DECIMAL(5,2) CHECK (predicted_wellness_score BETWEEN 0 AND 100),
  predicted_valence DECIMAL(4,2) CHECK (predicted_valence BETWEEN -1 AND 1),
  predicted_arousal DECIMAL(4,2) CHECK (predicted_arousal BETWEEN 0 AND 1),
  predicted_dominance DECIMAL(4,2) CHECK (predicted_dominance BETWEEN 0 AND 1),

  -- Confidence metrics
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  r_squared DECIMAL(3,2) CHECK (r_squared BETWEEN 0 AND 1),

  -- Confidence intervals (95% CI)
  wellness_ci_lower DECIMAL(5,2),
  wellness_ci_upper DECIMAL(5,2),
  valence_ci_lower DECIMAL(4,2),
  valence_ci_upper DECIMAL(4,2),

  -- Model information
  model_type VARCHAR(50) DEFAULT 'linear', -- 'linear', 'exponential', 'ensemble'
  training_data_points INTEGER,

  -- Timestamps and expiry
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Metadata (model parameters, validation metrics, etc.)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for prediction queries
CREATE INDEX idx_voice_predictions_user_date
  ON voice_predictions(user_id, prediction_date);
CREATE INDEX idx_voice_predictions_user_window
  ON voice_predictions(user_id, prediction_window);
CREATE INDEX idx_voice_predictions_expires
  ON voice_predictions(expires_at);
CREATE INDEX idx_voice_predictions_confidence
  ON voice_predictions(user_id, confidence_score DESC);

COMMENT ON TABLE voice_predictions IS 'Stores wellness forecasts with confidence intervals';
COMMENT ON COLUMN voice_predictions.prediction_window IS 'Forecast window: 7, 14, or 30 days ahead';
COMMENT ON COLUMN voice_predictions.r_squared IS 'Model fit quality (coefficient of determination)';
COMMENT ON COLUMN voice_predictions.expires_at IS 'Predictions expire and should be regenerated';

-- =============================================================================
-- Table 3: Enhanced User Insights
-- =============================================================================
-- Extend existing user_insights table with new columns for Phase IV

-- Check if columns already exist before adding them
DO $$
BEGIN
    -- Add urgency_level column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_insights' AND column_name = 'urgency_level'
    ) THEN
        ALTER TABLE user_insights ADD COLUMN urgency_level INTEGER;
        ALTER TABLE user_insights ADD CONSTRAINT check_urgency_level
          CHECK (urgency_level BETWEEN 1 AND 10);
    END IF;

    -- Add action_items column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_insights' AND column_name = 'action_items'
    ) THEN
        ALTER TABLE user_insights ADD COLUMN action_items JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add related_metrics column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_insights' AND column_name = 'related_metrics'
    ) THEN
        ALTER TABLE user_insights ADD COLUMN related_metrics JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add is_pinned column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_insights' AND column_name = 'is_pinned'
    ) THEN
        ALTER TABLE user_insights ADD COLUMN is_pinned BOOLEAN DEFAULT false;
    END IF;

    -- Add expires_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_insights' AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE user_insights ADD COLUMN expires_at TIMESTAMP;
    END IF;

    -- Add source_type column (if not already exists from Phase II)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_insights' AND column_name = 'source_type'
    ) THEN
        ALTER TABLE user_insights ADD COLUMN source_type VARCHAR(50);
    END IF;

    -- Add confidence_score column (if not already exists)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_insights' AND column_name = 'confidence_score'
    ) THEN
        ALTER TABLE user_insights ADD COLUMN confidence_score DECIMAL(3,2);
    END IF;
END $$;

-- New indexes for enhanced user_insights
CREATE INDEX IF NOT EXISTS idx_user_insights_urgency
  ON user_insights(user_id, urgency_level DESC);
CREATE INDEX IF NOT EXISTS idx_user_insights_pinned
  ON user_insights(user_id) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_user_insights_expires
  ON user_insights(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_insights_source_type
  ON user_insights(user_id, source_type);

COMMENT ON COLUMN user_insights.urgency_level IS 'Urgency score 1-10 for prioritization';
COMMENT ON COLUMN user_insights.action_items IS 'JSONB array of actionable steps';
COMMENT ON COLUMN user_insights.related_metrics IS 'JSONB object with correlated metric values';
COMMENT ON COLUMN user_insights.is_pinned IS 'User-pinned insights stay at top';
COMMENT ON COLUMN user_insights.expires_at IS 'Time-sensitive insights expire automatically';

-- =============================================================================
-- Table 4: Analytics Exports (Optional - for report generation tracking)
-- =============================================================================
-- Tracks generated reports and exports for download

CREATE TABLE IF NOT EXISTS analytics_exports (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Export details
  export_type VARCHAR(20) NOT NULL CHECK (export_type IN ('pdf', 'csv', 'json')),
  period_type VARCHAR(20) CHECK (period_type IN ('week', 'month', 'quarter', 'year')),

  -- Export options
  include_charts BOOLEAN DEFAULT true,
  include_insights BOOLEAN DEFAULT true,
  include_predictions BOOLEAN DEFAULT true,

  -- File information
  file_url VARCHAR(500),
  file_size_bytes INTEGER,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed', 'expired')),
  error_message TEXT,

  -- Timestamps
  requested_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for export tracking
CREATE INDEX idx_analytics_exports_user_status
  ON analytics_exports(user_id, status);
CREATE INDEX idx_analytics_exports_expires
  ON analytics_exports(expires_at) WHERE status = 'ready';

COMMENT ON TABLE analytics_exports IS 'Tracks generated analytics reports and exports';
COMMENT ON COLUMN analytics_exports.expires_at IS 'Exports expire after 7 days and are deleted';

-- =============================================================================
-- Utility Functions
-- =============================================================================

-- Function to calculate z-score for deviation detection
CREATE OR REPLACE FUNCTION calculate_z_score(
  value DECIMAL,
  baseline DECIMAL,
  std_dev DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  IF std_dev = 0 OR std_dev IS NULL THEN
    RETURN 0;
  END IF;
  RETURN (value - baseline) / std_dev;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_z_score IS 'Calculate z-score for baseline deviation detection';

-- Function to clean up expired predictions
CREATE OR REPLACE FUNCTION cleanup_expired_predictions() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM voice_predictions
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_predictions IS 'Removes expired predictions (run daily via cron)';

-- Function to cleanup expired exports
CREATE OR REPLACE FUNCTION cleanup_expired_exports() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM analytics_exports
  WHERE status = 'ready' AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_exports IS 'Removes expired export files (run daily via cron)';

-- =============================================================================
-- Sample Data (for testing - optional)
-- =============================================================================

-- Uncomment to insert sample baseline data for testing
/*
INSERT INTO voice_user_baselines (
  user_id, window_days, baseline_wellness_score, baseline_valence, baseline_arousal, baseline_dominance,
  wellness_std_dev, valence_std_dev, data_point_count, baseline_confidence
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
  30,
  72.5,
  0.3,
  0.45,
  0.6,
  8.2,
  0.15,
  28,
  0.92
) ON CONFLICT (user_id, window_days) DO NOTHING;
*/

-- =============================================================================
-- Migration Complete
-- =============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Phase IV database schema migration completed successfully';
  RAISE NOTICE 'Tables created: voice_user_baselines, voice_predictions, analytics_exports';
  RAISE NOTICE 'user_insights table enhanced with new columns';
  RAISE NOTICE 'Utility functions created for z-score calculation and cleanup';
END $$;
