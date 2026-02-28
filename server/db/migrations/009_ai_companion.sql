-- Phase 8 Feature 1: AI Mental Health Companion
-- Creates tables for AI chat companion functionality

-- Chat Conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'New Conversation',
  mood_before VARCHAR(50),
  mood_after VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user
  ON chat_conversations(user_id, created_at DESC);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id VARCHAR NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  emotion_detected VARCHAR(50),
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
  ON chat_messages(conversation_id, created_at ASC);

-- Conversation Insights
CREATE TABLE IF NOT EXISTS conversation_insights (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id VARCHAR NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL, -- 'coping_strategy', 'trigger', 'pattern', 'recommendation'
  title VARCHAR(255),
  content TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_insights_conversation
  ON conversation_insights(conversation_id, created_at DESC);

-- AI Companion Settings
CREATE TABLE IF NOT EXISTS ai_companion_settings (
  user_id VARCHAR PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  personality VARCHAR(50) DEFAULT 'empathetic', -- 'empathetic', 'professional', 'casual'
  response_length VARCHAR(20) DEFAULT 'balanced', -- 'concise', 'balanced', 'detailed'
  crisis_monitoring BOOLEAN DEFAULT true,
  proactive_check_ins BOOLEAN DEFAULT false,
  preferred_topics TEXT[],
  avoided_topics TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_chat_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_conversations_updated_at_trigger
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_conversations_updated_at();

-- Seed default AI settings for existing users
INSERT INTO ai_companion_settings (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM ai_companion_settings)
ON CONFLICT (user_id) DO NOTHING;
