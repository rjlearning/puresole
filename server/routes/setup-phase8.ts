import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// Run Phase 8 Feature 1 migration (AI Companion)
router.post('/setup/phase8-feature1', async (req: Request, res: Response) => {
  try {
    console.log('Running Phase 8 Feature 1 migration (AI Companion)...');

    // Chat Conversations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) DEFAULT 'New Conversation',
        mood_before VARCHAR(50),
        mood_after VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_conversations_user
        ON chat_conversations(user_id, created_at DESC)
    `);

    console.log('✅ Chat conversations table created');

    // Chat Messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        conversation_id VARCHAR NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        emotion_detected VARCHAR(50),
        sentiment_score DECIMAL(3,2),
        tokens_used INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
        ON chat_messages(conversation_id, created_at ASC)
    `);

    console.log('✅ Chat messages table created');

    // Conversation Insights
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversation_insights (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        conversation_id VARCHAR NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        insight_type VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        content TEXT NOT NULL,
        confidence_score DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_conversation_insights_conversation
        ON conversation_insights(conversation_id, created_at DESC)
    `);

    console.log('✅ Conversation insights table created');

    // AI Companion Settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_companion_settings (
        user_id VARCHAR PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        personality VARCHAR(50) DEFAULT 'empathetic',
        response_length VARCHAR(20) DEFAULT 'balanced',
        crisis_monitoring BOOLEAN DEFAULT true,
        proactive_check_ins BOOLEAN DEFAULT false,
        preferred_topics TEXT[],
        avoided_topics TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ AI companion settings table created');

    res.json({
      message: '✅ Phase 8 Feature 1 (AI Companion) tables created successfully!',
      tables: ['chat_conversations', 'chat_messages', 'conversation_insights', 'ai_companion_settings']
    });
  } catch (error: any) {
    console.error('❌ Phase 8 Feature 1 migration error:', error);
    res.status(500).json({
      error: 'Failed to run Phase 8 Feature 1 migration',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
