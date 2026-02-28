import { Router, Request, Response } from 'express';
import multer from 'multer';
import { pool } from '../db';
import { queueVoiceAnalysis, getJobStatus, cancelJob, getQueueStats } from '../queue/voiceAnalysisQueue';
import { storeAudioFile, deleteAudioFile, getUserStorageStats } from '../services/audioStorage';
import { getVoiceInsights, refreshVoiceInsights } from '../services/voiceInsightGeneration';
import { requireAuth } from '../multiAuth';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

/**
 * Configure multer for audio file uploads
 * Files are temporarily stored, then encrypted and moved to secure storage
 */
const upload = multer({
  dest: process.env.TEMP_UPLOAD_PATH || '/tmp/puresoul-uploads',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    const allowedMimes = [
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/webm',
      'audio/ogg',
      'audio/m4a',
      'audio/x-m4a',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only audio files are allowed.`));
    }
  },
});

/**
 * POST /api/voice/upload
 * Upload and queue audio file for analysis
 */
router.post('/voice/upload', requireAuth, upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(`📤 Received audio upload from user ${user.id}: ${file.originalname}`);

    // Check user settings and consent
    const { rows: settings } = await pool.query(
      'SELECT * FROM voice_user_settings WHERE user_id = $1',
      [user.id]
    );

    if (!settings[0]?.consent_given) {
      return res.status(403).json({
        error: 'Voice analysis consent required',
        message: 'Please review and accept the voice analysis consent form before uploading audio.'
      });
    }

    if (!settings[0]?.enable_recording_analysis) {
      return res.status(403).json({
        error: 'Voice analysis disabled',
        message: 'Voice recording analysis is disabled in your settings.'
      });
    }

    // Create voice analysis record
    const { rows: analysis } = await pool.query(
      `INSERT INTO voice_analyses (
        user_id,
        audio_file_path,
        audio_file_size,
        duration_seconds,
        sample_rate,
        processing_status,
        primary_emotion,
        emotion_confidence,
        wellness_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        user.id,
        file.path, // Temporary path, will be updated after encryption
        file.size,
        0, // Duration will be calculated by ML service
        16000, // Default sample rate
        'pending',
        'neutral', // Default until analysis completes
        0,
        50.0, // Default wellness score
      ]
    );

    const analysisId = analysis[0].id;

    // Encrypt and store audio file
    const { storagePath, fileSize, checksum } = await storeAudioFile(
      user.id,
      analysisId,
      file.path
    );

    // Update analysis record with encrypted file path
    await pool.query(
      `UPDATE voice_analyses
       SET audio_file_path = $1,
           audio_file_size = $2
       WHERE id = $3`,
      [storagePath, fileSize, analysisId]
    );

    // Delete temporary uploaded file
    await fs.unlink(file.path);

    // Queue for analysis
    await queueVoiceAnalysis({
      analysisId,
      userId: user.id,
      audioFilePath: storagePath,
      audioFileSize: fileSize,
      durationSeconds: 0,
      options: {
        enableTranscription: true,
        enableEmotionDetection: true,
        enableWellnessScore: true,
        enableCrisisMonitoring: settings[0]?.enable_crisis_monitoring ?? true,
      },
    });

    res.status(202).json({
      message: 'Audio uploaded and queued for analysis',
      analysisId,
      status: 'processing',
      checksum,
    });

  } catch (error: any) {
    console.error('Error uploading audio:', error);
    res.status(500).json({
      error: 'Failed to upload audio',
      details: error.message,
    });
  }
});

/**
 * GET /api/voice/analysis/:id
 * Get analysis results by ID with historical comparison
 * Returns current analysis + trend vs previous 5 analyses
 */
router.get('/voice/analysis/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { id } = req.params;

    // Get current analysis
    const { rows } = await pool.query(
      `SELECT * FROM voice_analyses
       WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysis = rows[0];

    // If still processing, get job status
    if (analysis.processing_status === 'pending' || analysis.processing_status === 'processing') {
      const jobStatus = await getJobStatus(id);
      analysis.job_status = jobStatus;
    }

    // Get previous 5 analyses for comparison
    const { rows: previousAnalyses } = await pool.query(
      `SELECT
        wellness_score, primary_emotion, valence, arousal, dominance,
        risk_level, created_at
       FROM voice_analyses
       WHERE user_id = $1
         AND id != $2
         AND created_at < (SELECT created_at FROM voice_analyses WHERE id = $3)
       ORDER BY created_at DESC
       LIMIT 5`,
      [user.id, id, id]
    );

    // Calculate trend vs previous average wellness
    let comparison = null;
    if (previousAnalyses.length > 0) {
      const avgPreviousWellness = previousAnalyses.reduce(
        (sum: number, a: any) => sum + a.wellness_score,
        0
      ) / previousAnalyses.length;

      const trend = analysis.wellness_score > avgPreviousWellness ? 'improving' :
        analysis.wellness_score < avgPreviousWellness ? 'declining' : 'stable';

      const wellnessChange = analysis.wellness_score - avgPreviousWellness;

      comparison = {
        trend,
        previous_avg_wellness: Math.round(avgPreviousWellness * 10) / 10,
        wellness_change: Math.round(wellnessChange * 10) / 10,
        recent_analyses: previousAnalyses.map((a: any) => ({
          wellness_score: a.wellness_score,
          primary_emotion: a.primary_emotion,
          valence: a.valence,
          arousal: a.arousal,
          dominance: a.dominance,
          risk_level: a.risk_level,
          created_at: a.created_at
        }))
      };
    }

    res.json({
      analysis,
      comparison
    });

  } catch (error: any) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({
      error: 'Failed to fetch analysis',
      details: error.message,
    });
  }
});

/**
 * GET /api/voice/analyses
 * List all analyses for current user
 */
router.get('/voice/analyses', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { limit = 20, offset = 0, status } = req.query;

    let query = `
      SELECT id, primary_emotion, emotion_confidence, wellness_score,
             risk_level, processing_status, duration_seconds, created_at
      FROM voice_analyses
      WHERE user_id = $1
    `;

    const params: any[] = [user.id];

    if (status) {
      query += ' AND processing_status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    // Get total count
    const { rows: countRows } = await pool.query(
      'SELECT COUNT(*) FROM voice_analyses WHERE user_id = $1',
      [user.id]
    );

    res.json({
      analyses: rows,
      total: parseInt(countRows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

  } catch (error: any) {
    console.error('Error listing analyses:', error);
    res.status(500).json({
      error: 'Failed to list analyses',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/voice/analysis/:id
 * Delete an analysis and its audio file
 */
router.delete('/voice/analysis/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { id } = req.params;

    // Get analysis to find audio file path
    const { rows } = await pool.query(
      'SELECT audio_file_path FROM voice_analyses WHERE id = $1 AND user_id = $2',
      [id, user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Delete audio file
    if (rows[0].audio_file_path) {
      await deleteAudioFile(rows[0].audio_file_path);
    }

    // Cancel job if still in queue
    await cancelJob(id);

    // Delete analysis record (cascades to correlations)
    await pool.query('DELETE FROM voice_analyses WHERE id = $1', [id]);

    res.json({ message: 'Analysis deleted successfully' });

  } catch (error: any) {
    console.error('Error deleting analysis:', error);
    res.status(500).json({
      error: 'Failed to delete analysis',
      details: error.message,
    });
  }
});

/**
 * GET /api/voice/wellness/trends
 * Get wellness trends over time with emotion distribution timeline
 * Supports: day/week/month/quarter periods
 * Returns: trends array + summary with total_recordings, avg_wellness, trend_direction
 * Cached: 6 hours via Redis
 */
router.get('/voice/wellness/trends', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { period = 'month' } = req.query;

    // Period mapping to days
    const periodMap: { [key: string]: number } = {
      day: 1,
      week: 7,
      month: 30,
      quarter: 90,
    };

    const days = periodMap[period as string] || 30;
    const cacheKey = `voice_trends:${user.id}:${period}`;

    // Try to get from cache (skip if table doesn't exist)
    try {
      const { rows: cachedResult } = await pool.query(
        `SELECT data, cached_at
         FROM cache_store
         WHERE cache_key = $1 AND expires_at > NOW()`,
        [cacheKey]
      );

      if (cachedResult.length > 0) {
        return res.json({
          period,
          trends: cachedResult[0].data.trends,
          summary: cachedResult[0].data.summary,
          cached: true,
          cached_at: cachedResult[0].cached_at
        });
      }
    } catch (cacheError) {
      // Cache table doesn't exist or error - just continue without cache
      console.log('Cache not available, fetching fresh data');
    }

    // Query voice_wellness_trends for the period
    const { rows: trends } = await pool.query(
      `SELECT
        period_start,
        period_end,
        period_type,
        avg_valence,
        avg_arousal,
        avg_wellness_score,
        emotion_distribution,
        trend_direction,
        recording_count
       FROM voice_wellness_trends
       WHERE user_id = $1
         AND period_start >= NOW() - INTERVAL '${days} days'
         AND period_type = 'day'
       ORDER BY period_start ASC`,
      [user.id]
    );

    // If no trends exist, calculate from raw analyses
    let trendData = trends;
    if (trends.length === 0) {
      // Fall back to calculating from voice_analyses
      const { rows: analyses } = await pool.query(
        `SELECT
          wellness_score,
          valence,
          arousal,
          primary_emotion,
          created_at
         FROM voice_analyses
         WHERE user_id = $1
           AND created_at >= NOW() - INTERVAL '${days} days'
         ORDER BY created_at ASC`,
        [user.id]
      );

      // Group by day
      const groupedByDay = new Map();
      analyses.forEach((a: any) => {
        const dateKey = a.created_at.split('T')[0];
        if (!groupedByDay.has(dateKey)) {
          groupedByDay.set(dateKey, []);
        }
        groupedByDay.get(dateKey).push(a);
      });

      trendData = Array.from(groupedByDay.entries()).map(([date, dayAnalyses]: [string, any[]]) => {
        const avgWellness = dayAnalyses.reduce((sum, a) => sum + a.wellness_score, 0) / dayAnalyses.length;
        const avgValence = dayAnalyses.reduce((sum, a) => sum + a.valence, 0) / dayAnalyses.length;
        const avgArousal = dayAnalyses.reduce((sum, a) => sum + a.arousal, 0) / dayAnalyses.length;

        const emotionCounts: { [key: string]: number } = {};
        dayAnalyses.forEach((a: any) => {
          emotionCounts[a.primary_emotion] = (emotionCounts[a.primary_emotion] || 0) + 1;
        });

        return {
          period_start: new Date(date).toISOString(),
          period_end: new Date(new Date(date).getTime() + 86400000).toISOString(),
          period_type: 'day',
          avg_valence: Math.round(avgValence * 100) / 100,
          avg_arousal: Math.round(avgArousal * 100) / 100,
          avg_wellness_score: Math.round(avgWellness * 10) / 10,
          emotion_distribution: emotionCounts,
          trend_direction: 'stable',
          recording_count: dayAnalyses.length
        };
      });
    }

    // Calculate overall summary
    const totalRecordings = trendData.reduce((sum: number, t: any) => sum + (t.recording_count || 0), 0);
    const avgWellness = trendData.length > 0
      ? Math.round(trendData.reduce((sum: number, t: any) => sum + (t.avg_wellness_score || 0), 0) / trendData.length * 10) / 10
      : 0;

    // Determine overall trend direction
    let trendDirection = 'stable';
    if (trendData.length > 7) {
      const recentAvg = trendData.slice(-7).reduce((sum: number, t: any) => sum + (t.avg_wellness_score || 0), 0) / 7;
      const olderAvg = trendData.slice(0, 7).reduce((sum: number, t: any) => sum + (t.avg_wellness_score || 0), 0) / 7;
      trendDirection = recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable';
    }

    const summary = {
      total_recordings: totalRecordings,
      avg_wellness: avgWellness,
      trend_direction: trendDirection,
      period_days: days
    };

    const responseData = {
      trends: trendData,
      summary
    };

    // Cache for 6 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 6);

    await pool.query(
      `INSERT INTO cache_store (cache_key, data, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (cache_key)
       DO UPDATE SET data = $2, expires_at = $3, cached_at = NOW()`,
      [cacheKey, JSON.stringify(responseData), expiresAt.toISOString()]
    ).catch((err: any) => console.log('Cache insert failed (non-critical):', err.message));

    res.json({
      period,
      ...responseData,
      cached: false
    });

  } catch (error: any) {
    console.error('Error fetching wellness trends:', error);
    res.status(500).json({
      error: 'Failed to fetch wellness trends',
      details: error.message,
    });
  }
});

/**
 * GET /api/voice/trends (legacy endpoint for compatibility)
 * Get wellness trends over time
 */
router.get('/voice/trends', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { period = 'week' } = req.query;

    const { rows } = await pool.query(
      `SELECT * FROM voice_wellness_trends
       WHERE user_id = $1 AND period_type = $2
       ORDER BY period_start DESC
       LIMIT 12`,
      [user.id, period]
    );

    res.json({ trends: rows });

  } catch (error: any) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      error: 'Failed to fetch trends',
      details: error.message,
    });
  }
});

/**
 * GET /api/voice/storage/stats
 * Get user's storage statistics
 */
router.get('/voice/storage/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const stats = await getUserStorageStats(user.id);
    res.json(stats);

  } catch (error: any) {
    console.error('Error fetching storage stats:', error);
    res.status(500).json({
      error: 'Failed to fetch storage stats',
      details: error.message,
    });
  }
});

/**
 * GET /api/voice/queue/stats (Admin only)
 * Get queue statistics
 */
router.get('/voice/queue/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = await getQueueStats();
    res.json(stats);

  } catch (error: any) {
    console.error('Error fetching queue stats:', error);
    res.status(500).json({
      error: 'Failed to fetch queue stats',
      details: error.message,
    });
  }
});

/**
 * GET /api/voice/dashboard
 * Aggregated dashboard endpoint returning:
 * - recent_analyses: last 10 completed analyses
 * - trends_30day: wellness trends for 30 days
 * - top_insights: top 5 insights from voice analysis
 * - correlations: top 3 correlations with other health metrics
 * - stats: summary statistics
 * Uses Promise.all for parallel queries
 * Cached: 6 hours via Redis
 */
router.get('/voice/dashboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const cacheKey = `voice_dashboard:${user.id}`;

    // Try to get from cache (skip if table doesn't exist)
    try {
      const { rows: cachedResult } = await pool.query(
        `SELECT data, cached_at
         FROM cache_store
         WHERE cache_key = $1 AND expires_at > NOW()`,
        [cacheKey]
      );

      if (cachedResult.length > 0) {
        return res.json({
          ...cachedResult[0].data,
          cached: true,
          cached_at: cachedResult[0].cached_at
        });
      }
    } catch (cacheError) {
      // Cache table doesn't exist or error - just continue without cache
      console.log('Cache not available, fetching fresh data');
    }

    // Parallel queries using Promise.all
    const [
      recentAnalysesResult,
      trendsResult,
      insightsResult,
      correlationsResult,
      statsResult
    ] = await Promise.all([
      // Recent analyses
      pool.query(
        `SELECT
          id, primary_emotion, emotion_confidence, wellness_score,
          valence, arousal, dominance, risk_level,
          processing_status, duration_seconds, created_at, transcript,
          acoustic_features
         FROM voice_analyses
         WHERE user_id = $1 AND processing_status = 'completed'
         ORDER BY created_at DESC
         LIMIT 10`,
        [user.id]
      ).catch(() => ({ rows: [] })),
      // Wellness trends for 30 days
      pool.query(
        `SELECT
          period_start, avg_wellness_score, emotion_distribution,
          trend_direction, recording_count
         FROM voice_wellness_trends
         WHERE user_id = $1
           AND period_start >= NOW() - INTERVAL '30 days'
           AND period_type = 'day'
         ORDER BY period_start ASC`,
        [user.id]
      ).catch(() => ({ rows: [] })),
      // Top insights
      pool.query(
        `SELECT
          id, insight_type, title, description,
          confidence_score, priority, created_at
         FROM user_insights
         WHERE user_id = $1 AND source_type = 'voice_analysis'
         ORDER BY priority DESC, created_at DESC
         LIMIT 5`,
        [user.id]
      ).catch(() => ({ rows: [] })),
      // Correlations (from voice_correlations table if it exists)
      pool.query(
        `SELECT
          correlated_with_type, correlation_strength, confidence
         FROM voice_correlations
         WHERE user_id = $1
         ORDER BY ABS(correlation_strength) DESC
         LIMIT 3`,
        [user.id]
      ).catch(() => ({ rows: [] })), // Handle if table doesn't exist
      // Statistics
      pool.query(
        `SELECT
          COUNT(*) as total_analyses,
          AVG(wellness_score) as avg_wellness,
          AVG(duration_seconds) as avg_duration,
          SUM(duration_seconds) as total_duration,
          COUNT(CASE WHEN risk_level = 'high' OR risk_level = 'critical' THEN 1 END) as high_risk_count
         FROM voice_analyses
         WHERE user_id = $1 AND processing_status = 'completed'`,
        [user.id]
      ).catch(() => ({ rows: [{ total_analyses: 0, avg_wellness: 0, avg_duration: 0, total_duration: 0, high_risk_count: 0 }] }))
    ]);

    // Process recent analyses
    const recentAnalyses = recentAnalysesResult.rows.map((a: any) => ({
      id: a.id,
      primary_emotion: a.primary_emotion,
      emotion_confidence: a.emotion_confidence,
      wellness_score: a.wellness_score,
      valence: a.valence,
      arousal: a.arousal,
      dominance: a.dominance,
      risk_level: a.risk_level,
      duration_seconds: a.duration_seconds,
      created_at: a.created_at,
      transcript: a.transcript ? a.transcript.substring(0, 200) : null,
      biomarkers: a.acoustic_features?.opensmile_biomarkers || null
    }));

    // Process trends - if empty, calculate from raw analyses
    let trends = trendsResult.rows;
    if (trends.length === 0) {
      const { rows: analyses } = await pool.query(
        `SELECT
          wellness_score, created_at
         FROM voice_analyses
         WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
         ORDER BY created_at ASC`,
        [user.id]
      );

      const groupedByDay = new Map();
      analyses.forEach((a: any) => {
        const dateKey = a.created_at instanceof Date ? a.created_at.toISOString().split('T')[0] : String(a.created_at).split('T')[0];
        if (!groupedByDay.has(dateKey)) {
          groupedByDay.set(dateKey, []);
        }
        groupedByDay.get(dateKey).push(a);
      });

      trends = Array.from(groupedByDay.entries()).map(([date, dayAnalyses]: [string, any[]]) => {
        const avgWellness = dayAnalyses.reduce((sum, a) => sum + a.wellness_score, 0) / dayAnalyses.length;
        return {
          period_start: new Date(date).toISOString(),
          avg_wellness_score: Math.round(avgWellness * 10) / 10,
          emotion_distribution: {},
          trend_direction: 'stable',
          recording_count: dayAnalyses.length
        };
      });
    }

    // Process stats
    const stats = statsResult.rows[0];
    const totalAnalyses = parseInt(stats.total_analyses) || 0;
    const avgWellness = stats.avg_wellness ? Math.round(parseFloat(stats.avg_wellness) * 10) / 10 : 0;
    const totalDurationMinutes = stats.total_duration ? Math.round(parseInt(stats.total_duration) / 60) : 0;

    // Determine current trend direction
    let currentTrend = 'stable';
    if (trends.length > 7) {
      const recentAvg = trends.slice(-7).reduce((sum: number, t: any) => sum + t.avg_wellness_score, 0) / 7;
      const olderAvg = trends.slice(0, 7).reduce((sum: number, t: any) => sum + t.avg_wellness_score, 0) / 7;
      currentTrend = recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable';
    }

    // Process insights
    const insights = insightsResult.rows.map((i: any) => ({
      id: i.id,
      type: i.insight_type,
      title: i.title,
      description: i.description,
      confidence: i.confidence_score,
      priority: i.priority,
      created_at: i.created_at
    }));

    // Process correlations
    const correlations = correlationsResult.rows.map((c: any) => ({
      with: c.correlated_with_type,
      strength: Math.round(c.correlation_strength * 100) / 100,
      confidence: Math.round(c.confidence * 100) / 100
    }));

    const dashboardData = {
      recent_analyses: recentAnalyses,
      trends_30day: trends,
      top_insights: insights,
      correlations: correlations,
      stats: {
        total_analyses: totalAnalyses,
        avg_wellness: avgWellness,
        current_trend: currentTrend,
        total_duration_minutes: totalDurationMinutes,
        high_risk_count: parseInt(stats.high_risk_count) || 0
      }
    };

    // Cache for 6 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 6);

    await pool.query(
      `INSERT INTO cache_store (cache_key, data, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (cache_key)
       DO UPDATE SET data = $2, expires_at = $3, cached_at = NOW()`,
      [cacheKey, JSON.stringify(dashboardData), expiresAt.toISOString()]
    ).catch((err: any) => console.log('Cache insert failed (non-critical):', err.message));

    res.json({
      ...dashboardData,
      cached: false
    });

  } catch (error: any) {
    console.error('Error fetching voice dashboard:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      details: error.message,
    });
  }
});

/**
 * POST /api/voice/dashboard/refresh
 * Force refresh dashboard cache
 */
router.post('/voice/dashboard/refresh', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const cacheKey = `voice_dashboard:${user.id}`;

    // Clear cache
    await pool.query(
      `DELETE FROM cache_store WHERE cache_key = $1`,
      [cacheKey]
    ).catch(() => { }); // Ignore if cache table doesn't exist

    res.json({ message: 'Dashboard cache cleared' });

  } catch (error: any) {
    console.error('Error refreshing dashboard:', error);
    res.status(500).json({
      error: 'Failed to refresh dashboard',
      details: error.message,
    });
  }
});

/**
 * GET /api/voice/insights
 * Get AI-powered insights from voice analysis trends
 * Uses priority system: High (significant changes) > Medium (patterns) > Low (observations)
 * Cached: 12-24 hours
 */
router.get('/voice/insights', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const insights = await getVoiceInsights(user.id);

    res.json({
      insights,
      count: insights.length,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error fetching voice insights:', error);
    res.status(500).json({
      error: 'Failed to fetch voice insights',
      details: error.message,
    });
  }
});

/**
 * POST /api/voice/insights/refresh
 * Force refresh voice insights
 */
router.post('/voice/insights/refresh', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const insights = await refreshVoiceInsights(user.id);

    res.json({
      message: 'Voice insights refreshed',
      insights,
      count: insights.length,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error refreshing voice insights:', error);
    res.status(500).json({
      error: 'Failed to refresh voice insights',
      details: error.message,
    });
  }
});

export default router;
