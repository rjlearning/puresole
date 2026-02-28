-- Phase 7: Advanced Analytics Dashboard
-- Analytics cache and insights tables

-- Analytics Cache Table (stores pre-computed analytics)
CREATE TABLE IF NOT EXISTS analytics_cache (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  metric_type VARCHAR(50) NOT NULL, -- 'mood_trend', 'correlation', 'prediction', 'heatmap'
  time_period VARCHAR(50) NOT NULL, -- 'week', 'month', 'quarter', 'year', 'all'

  data JSONB NOT NULL,
  calculated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,

  UNIQUE(user_id, metric_type, time_period)
);

CREATE INDEX IF NOT EXISTS idx_analytics_cache_user ON analytics_cache(user_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON analytics_cache(expires_at);

-- User Insights Table (AI-generated insights and recommendations)
CREATE TABLE IF NOT EXISTS user_insights (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  insight_type VARCHAR(50) NOT NULL, -- 'pattern', 'recommendation', 'warning', 'achievement', 'correlation'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  priority INTEGER DEFAULT 0, -- Higher = more important

  metadata JSONB, -- Additional data like charts, suggested actions

  status VARCHAR(50) DEFAULT 'new', -- 'new', 'viewed', 'acted_on', 'dismissed'
  viewed_at TIMESTAMP,
  acted_on_at TIMESTAMP,
  dismissed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_insights_user ON user_insights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_insights_status ON user_insights(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_insights_type ON user_insights(insight_type);

SELECT '✅ Phase 7: Analytics tables created!' as message;
