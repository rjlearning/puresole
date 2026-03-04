import { Router, Request, Response } from 'express';
import { pool } from '../db';
import {
  getChatCompletion,
  generateConversationTitle,
  generateConversationInsights,
  getGuidedExercise
} from '../services/aiCompanion';

const router = Router();

// ============================================
// CONVERSATIONS
// ============================================

// GET /api/ai-companion/conversations - Get all conversations
router.get('/ai-companion/conversations', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    const result = await pool.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id) as message_count,
        (SELECT content FROM chat_messages WHERE conversation_id = c.id AND role = 'user' ORDER BY created_at ASC LIMIT 1) as first_message
       FROM chat_conversations c
       WHERE c.user_id = $1
       ORDER BY c.updated_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      message: 'Conversations retrieved',
      conversations: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// POST /api/ai-companion/conversations - Create new conversation
router.post('/ai-companion/conversations', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { title, moodBefore } = req.body;

    const result = await pool.query(
      `INSERT INTO chat_conversations (user_id, title, mood_before)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, title || 'New Conversation', moodBefore || null]
    );

    res.json({
      message: 'Conversation created',
      conversation: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation', details: error.message, stack: error.stack });
  }
});

// GET /api/ai-companion/conversations/:id - Get conversation with messages
router.get('/ai-companion/conversations/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;

    // Get conversation
    const convResult = await pool.query(
      'SELECT * FROM chat_conversations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages
    const messagesResult = await pool.query(
      `SELECT * FROM chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    res.json({
      message: 'Conversation retrieved',
      conversation: convResult.rows[0],
      messages: messagesResult.rows
    });
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// DELETE /api/ai-companion/conversations/:id - Delete conversation
router.delete('/ai-companion/conversations/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM chat_conversations WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted' });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// ============================================
// CHAT MESSAGES
// ============================================

// POST /api/ai-companion/chat - Send message and get AI response
router.post('/ai-companion/chat', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { conversationId, message } = req.body;

    if (!message || !conversationId) {
      return res.status(400).json({ error: 'Message and conversationId required' });
    }

    // Verify conversation belongs to user
    const convCheck = await pool.query(
      'SELECT id FROM chat_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Save user message
    await pool.query(
      `INSERT INTO chat_messages (conversation_id, role, content)
       VALUES ($1, 'user', $2)`,
      [conversationId, message]
    );

    // Get conversation history
    const historyResult = await pool.query(
      `SELECT role, content FROM chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC
       LIMIT 20`,
      [conversationId]
    );

    const messages = historyResult.rows.map((row: any) => ({
      role: row.role,
      content: row.content
    }));

    // Get AI response
    const aiResponse = await getChatCompletion(messages, userId, conversationId);

    // Save AI message
    await pool.query(
      `INSERT INTO chat_messages (conversation_id, role, content, emotion_detected, tokens_used)
       VALUES ($1, 'assistant', $2, $3, $4)`,
      [conversationId, aiResponse.response, aiResponse.emotionDetected || null, aiResponse.tokensUsed || null]
    );

    // Update conversation updated_at
    await pool.query(
      'UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1',
      [conversationId]
    );

    // Auto-generate title if this is the first exchange
    if (messages.length <= 2) {
      const title = await generateConversationTitle(messages);
      await pool.query(
        'UPDATE chat_conversations SET title = $1 WHERE id = $2',
        [title, conversationId]
      );
    }

    res.json({
      message: 'Message sent',
      response: aiResponse.response,
      emotionDetected: aiResponse.emotionDetected,
      hasCrisisIndicators: aiResponse.hasCrisisIndicators
    });
  } catch (error: any) {
    console.error('Error in chat:', error);
    res.status(500).json({
      error: 'Failed to send message',
      details: error.message
    });
  }
});

// ============================================
// INSIGHTS
// ============================================

// POST /api/ai-companion/conversations/:id/insights - Generate insights
router.post('/ai-companion/conversations/:id/insights', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;

    // Verify ownership
    const convCheck = await pool.query(
      'SELECT id FROM chat_conversations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Generate insights
    const insights = await generateConversationInsights(id);

    // Save insights
    for (const insight of insights) {
      await pool.query(
        `INSERT INTO conversation_insights (conversation_id, insight_type, title, content, confidence_score)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, insight.type, insight.title, insight.content, insight.confidence || null]
      );
    }

    res.json({
      message: 'Insights generated',
      insights
    });
  } catch (error: any) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// ============================================
// GUIDED EXERCISES
// ============================================

// GET /api/ai-companion/exercise/:type - Get guided exercise
router.get('/ai-companion/exercise/:type', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { type } = req.params;

    if (!['breathing', 'grounding', 'progressive_relaxation'].includes(type)) {
      return res.status(400).json({ error: 'Invalid exercise type' });
    }

    const exercise = await getGuidedExercise(type as any);

    res.json({
      message: 'Exercise retrieved',
      exercise
    });
  } catch (error: any) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
});

// ============================================
// SETTINGS
// ============================================

// GET /api/ai-companion/settings - Get AI settings
router.get('/ai-companion/settings', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    const result = await pool.query(
      'SELECT * FROM ai_companion_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default settings
      const newSettings = await pool.query(
        `INSERT INTO ai_companion_settings (user_id)
         VALUES ($1)
         RETURNING *`,
        [userId]
      );
      return res.json({ settings: newSettings.rows[0] });
    }

    res.json({ settings: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/ai-companion/settings - Update AI settings
router.put('/ai-companion/settings', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { personality, responseLength, crisisMonitoring, proactiveCheckIns } = req.body;

    const result = await pool.query(
      `UPDATE ai_companion_settings
       SET personality = COALESCE($2, personality),
           response_length = COALESCE($3, response_length),
           crisis_monitoring = COALESCE($4, crisis_monitoring),
           proactive_check_ins = COALESCE($5, proactive_check_ins),
           updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId, personality || null, responseLength || null, crisisMonitoring ?? null, proactiveCheckIns ?? null]
    );

    res.json({
      message: 'Settings updated',
      settings: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
