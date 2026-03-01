import { Router } from 'express';
import { pool } from '../db';
import { analyzeVoiceEntry } from '../services/emotionDetection';

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

router.post('/analysis/process/:entryId', requireAuth, async (req, res) => {
  try {
    const { entryId } = req.params;
    const userId = (req.user as any)?.id;

    console.log(`[Analysis] Processing entry ${entryId} for user ${userId}`);

    const result = await pool.query(
      'SELECT * FROM voice_entries WHERE id = $1 AND user_id = $2',
      [entryId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Voice entry not found' });
    }

    const entry = result.rows[0];

    const jobResult = await pool.query(
      'INSERT INTO analysis_jobs (entry_id, status) VALUES ($1, $2) RETURNING id',
      [entryId, 'processing']
    );

    processAnalysisAsync(entryId, entry, userId).catch(err =>
      console.error('[Analysis] Background error:', err)
    );

    res.json({ message: 'Analysis started', jobId: jobResult.rows[0].id });
  } catch (error) {
    console.error('[Analysis] Trigger error:', error);
    res.status(500).json({ error: 'Failed to start analysis' });
  }
});

async function processAnalysisAsync(entryId: string, entry: any, userId: string) {
  try {
    console.log(`[Analysis] Running analysis for entry ${entryId}`);

    // Strip leading slash if present for filesystem access
    const audioPath = entry.audio_url.startsWith('/') ? entry.audio_url.substring(1) : entry.audio_url;

    const analysis = await analyzeVoiceEntry(
      audioPath,
      entry.mood_before,
      entry.notes
    );

    await pool.query(
      'UPDATE voice_entries SET ai_analysis = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(analysis), entryId]
    );

    // Map AI analysis to voice_analyses for the medical-grade dashboard
    const primaryEmotion = analysis.dominant.toLowerCase();
    const validEmotions = ['happy', 'sad', 'anxious', 'stressed', 'calm', 'angry', 'fearful', 'surprised', 'neutral', 'excited', 'tired'];
    const mappedEmotion = validEmotions.includes(primaryEmotion) ? primaryEmotion : 'neutral';

    // Calculate VAD and other metrics for the dashboard
    const valence = analysis.moodScore / 100;
    const arousal = analysis.energyLevel / 100;
    const dominance = analysis.intensity || 0.5;
    const riskLevel = analysis.stressLevel > 80 || analysis.anxietyLevel > 80 ? 'high' :
      analysis.stressLevel > 60 || analysis.anxietyLevel > 60 ? 'medium' : 'low';

    // Construct emotion_scores object for the dashboard
    const emotionScores: Record<string, number> = {};
    if (analysis.emotions) {
      analysis.emotions.forEach((e: string) => {
        emotionScores[e] = analysis.dominant === e ? analysis.intensity : 0.4;
      });
    }

    await pool.query(
      `INSERT INTO voice_analyses (
        user_id, journal_entry_id, primary_emotion, 
        stress_indicators, wellness_score, 
        valence, arousal, dominance, risk_level,
        emotion_scores, emotion_confidence,
        transcript, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
      [
        userId, entryId, analysis.dominant,
        JSON.stringify(analysis.mentalStatus),
        Math.round((analysis.moodScore * 0.3 + (100 - analysis.stressLevel) * 0.3 +
          (100 - analysis.anxietyLevel) * 0.2 + analysis.energyLevel * 0.2)),
        valence, arousal, dominance, riskLevel,
        JSON.stringify(emotionScores), analysis.intensity,
        analysis.transcript
      ]
    );

    const today = new Date().toISOString().split('T')[0];

    await pool.query(
      `INSERT INTO emotional_blueprints (
        user_id, date, stress_score, anxiety_score, mood_score, 
        energy_level, sleep_quality, detected_emotions, insights, wellness_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id, date) 
      DO UPDATE SET
        stress_score = $3,
        anxiety_score = $4,
        mood_score = $5,
        energy_level = $6,
        detected_emotions = $8,
        insights = $9,
        wellness_score = $10,
        updated_at = NOW()`,
      [
        userId, today,
        analysis.stressLevel, analysis.anxietyLevel, analysis.moodScore,
        analysis.energyLevel, 75,
        JSON.stringify(analysis.emotions || []), JSON.stringify(analysis.insights || []),
        Math.round((analysis.moodScore * 0.3 + (100 - analysis.stressLevel) * 0.3 +
          (100 - analysis.anxietyLevel) * 0.2 + analysis.energyLevel * 0.2))
      ]
    );

    await pool.query(
      'UPDATE analysis_jobs SET status = $1, completed_at = NOW() WHERE entry_id = $2',
      ['completed', entryId]
    );

    console.log(`[Analysis] Completed for entry ${entryId}`);
  } catch (error: any) {
    console.error(`[Analysis] Failed:`, error);
    await pool.query(
      'UPDATE analysis_jobs SET status = $1, error_message = $2 WHERE entry_id = $3',
      ['failed', error.message, entryId]
    );
  }
}

router.get('/blueprint/current', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const today = new Date().toISOString().split('T')[0];

    // Auto-create table if it doesn't exist yet
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emotional_blueprints (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        date DATE NOT NULL,
        stress_score NUMERIC DEFAULT 50,
        anxiety_score NUMERIC DEFAULT 40,
        mood_score NUMERIC DEFAULT 60,
        energy_level NUMERIC DEFAULT 50,
        sleep_quality NUMERIC DEFAULT 75,
        detected_emotions JSONB DEFAULT '[]',
        insights JSONB DEFAULT '[]',
        wellness_score NUMERIC DEFAULT 60,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, date)
      )
    `);

    const result = await pool.query(
      'SELECT * FROM emotional_blueprints WHERE user_id = $1 AND date = $2',
      [userId, today]
    );

    res.json({ blueprint: result.rows[0] || null });
  } catch (error) {
    console.error('[Blueprint] Error:', error);
    res.status(500).json({ error: 'Failed to fetch blueprint' });
  }
});


router.get('/blueprint/history', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const limit = parseInt(req.query.limit as string) || 30;

    // Graceful: if table doesn't exist return empty array
    try {
      const result = await pool.query(
        'SELECT * FROM emotional_blueprints WHERE user_id = $1 ORDER BY date DESC LIMIT $2',
        [userId, limit]
      );
      res.json({ blueprints: result.rows });
    } catch (tableErr: any) {
      if (tableErr.code === '42P01') {
        // Table doesn't exist yet — return empty, not an error
        return res.json({ blueprints: [] });
      }
      throw tableErr;
    }
  } catch (error) {
    console.error('[Blueprint] Error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});


export default router;
