-- ============================================================================
-- Phase III: Real-Time Voice Analysis - Database Schema
-- ============================================================================
-- Creates tables and types for real-time voice emotion detection sessions
-- Supports WebSocket-based streaming with <500ms latency
-- ============================================================================

-- Create enum type for session status
DO $$ BEGIN
  CREATE TYPE realtime_session_status AS ENUM ('active', 'completed', 'interrupted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Table: voice_realtime_sessions
-- ============================================================================
-- Stores real-time voice analysis sessions with streaming audio chunks
-- Sessions are created when user starts real-time recording
-- Updated when session ends or is interrupted
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_realtime_sessions (
  -- Primary identification
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Session timing
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_seconds INTEGER,

  -- Session status and metadata
  status realtime_session_status NOT NULL DEFAULT 'active',
  total_chunks_processed INTEGER DEFAULT 0,

  -- Emotion detection results (JSONB array of emotion updates)
  -- Structure: [{ timestamp, primary_emotion, emotion_scores, valence, arousal, dominance, processingTime }, ...]
  emotions_detected JSONB DEFAULT '[]'::jsonb,

  -- Additional session metadata (JSONB)
  -- Can include: browser info, connection quality, crisis alerts triggered, etc.
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Index for querying user's sessions
CREATE INDEX IF NOT EXISTS idx_voice_realtime_sessions_user_id
  ON voice_realtime_sessions(user_id);

-- Index for finding active sessions
CREATE INDEX IF NOT EXISTS idx_voice_realtime_sessions_status
  ON voice_realtime_sessions(status)
  WHERE status = 'active';

-- Index for time-based queries (recent sessions)
CREATE INDEX IF NOT EXISTS idx_voice_realtime_sessions_started_at
  ON voice_realtime_sessions(started_at DESC);

-- Composite index for user's recent sessions
CREATE INDEX IF NOT EXISTS idx_voice_realtime_sessions_user_started
  ON voice_realtime_sessions(user_id, started_at DESC);

-- Index for completed sessions with duration data
CREATE INDEX IF NOT EXISTS idx_voice_realtime_sessions_completed
  ON voice_realtime_sessions(user_id, ended_at DESC)
  WHERE status = 'completed';

-- GIN index for efficient JSONB queries on emotions_detected
CREATE INDEX IF NOT EXISTS idx_voice_realtime_sessions_emotions
  ON voice_realtime_sessions USING GIN (emotions_detected);

-- GIN index for efficient JSONB queries on metadata
CREATE INDEX IF NOT EXISTS idx_voice_realtime_sessions_metadata
  ON voice_realtime_sessions USING GIN (metadata);

-- ============================================================================
-- Trigger: Update timestamp on row modification
-- ============================================================================

CREATE OR REPLACE FUNCTION update_voice_realtime_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_voice_realtime_sessions_updated_at
  ON voice_realtime_sessions;

CREATE TRIGGER trigger_update_voice_realtime_sessions_updated_at
  BEFORE UPDATE ON voice_realtime_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_realtime_sessions_updated_at();

-- ============================================================================
-- Cleanup Function: Remove old interrupted sessions
-- ============================================================================
-- Removes interrupted sessions older than 7 days to prevent database bloat
-- Run periodically via cron job or scheduled task
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_interrupted_sessions(days_old INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM voice_realtime_sessions
  WHERE status = 'interrupted'
    AND created_at < NOW() - (days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Helper Function: Get session statistics
-- ============================================================================
-- Returns aggregated statistics for a user's real-time sessions
-- Useful for analytics and user insights
-- ============================================================================

CREATE OR REPLACE FUNCTION get_realtime_session_stats(p_user_id VARCHAR, days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_sessions BIGINT,
  completed_sessions BIGINT,
  interrupted_sessions BIGINT,
  total_duration_minutes NUMERIC,
  avg_duration_minutes NUMERIC,
  total_emotions_detected BIGINT,
  avg_emotions_per_session NUMERIC,
  most_recent_session TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_sessions,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_sessions,
    COUNT(*) FILTER (WHERE status = 'interrupted')::BIGINT as interrupted_sessions,
    COALESCE(SUM(duration_seconds) / 60.0, 0)::NUMERIC as total_duration_minutes,
    COALESCE(AVG(duration_seconds) / 60.0, 0)::NUMERIC as avg_duration_minutes,
    COALESCE(SUM(jsonb_array_length(emotions_detected)), 0)::BIGINT as total_emotions_detected,
    COALESCE(AVG(jsonb_array_length(emotions_detected)), 0)::NUMERIC as avg_emotions_per_session,
    MAX(started_at) as most_recent_session
  FROM voice_realtime_sessions
  WHERE user_id = p_user_id
    AND started_at >= NOW() - (days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Sample Query Examples
-- ============================================================================

-- Get all active sessions for a user
-- SELECT * FROM voice_realtime_sessions
-- WHERE user_id = 'user-uuid' AND status = 'active';

-- Get recent completed sessions with emotion data
-- SELECT id, started_at, ended_at, duration_seconds,
--        jsonb_array_length(emotions_detected) as emotion_count,
--        emotions_detected->-1->>'primary_emotion' as last_emotion
-- FROM voice_realtime_sessions
-- WHERE user_id = 'user-uuid' AND status = 'completed'
-- ORDER BY started_at DESC
-- LIMIT 10;

-- Get session statistics for a user
-- SELECT * FROM get_realtime_session_stats('user-uuid', 30);

-- Find sessions with crisis alerts in metadata
-- SELECT * FROM voice_realtime_sessions
-- WHERE metadata @> '{"crisis_alerts": []}'
--   AND jsonb_array_length(metadata->'crisis_alerts') > 0;

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON TABLE voice_realtime_sessions IS
  'Stores real-time voice analysis sessions with WebSocket streaming. Part of Phase III: Real-Time Emotion Detection.';

COMMENT ON COLUMN voice_realtime_sessions.emotions_detected IS
  'JSONB array of emotion updates: [{ timestamp, primary_emotion, emotion_scores, valence, arousal, dominance, processingTime }]';

COMMENT ON COLUMN voice_realtime_sessions.metadata IS
  'Additional session data: browser info, connection quality, crisis alerts, processing errors, etc.';

COMMENT ON FUNCTION cleanup_old_interrupted_sessions IS
  'Removes interrupted sessions older than specified days (default: 7). Run periodically to prevent database bloat.';

COMMENT ON FUNCTION get_realtime_session_stats IS
  'Returns aggregated statistics for a user''s real-time sessions over specified days (default: 30).';

-- ============================================================================
-- End of Migration
-- ============================================================================
