import { Job } from 'bull';
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';
import { pool } from '../../db';
import type { VoiceAnalysisJobData, VoiceAnalysisJobResult } from '../voiceAnalysisQueue';

/**
 * Voice Analysis Job Processor
 *
 * Processes voice analysis jobs by:
 * 1. Sending audio file to Python ML service
 * 2. Receiving analysis results
 * 3. Updating database with results
 * 4. Triggering any necessary alerts (crisis detection)
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export async function processVoiceAnalysis(
  job: Job<VoiceAnalysisJobData>
): Promise<VoiceAnalysisJobResult> {
  const { analysisId, userId, audioFilePath, options } = job.data;

  console.log(`🎤 Processing voice analysis: ${analysisId}`);

  try {
    // Update job progress
    await job.progress(10);

    // Step 1: Update database status to "processing"
    await pool.query(
      `UPDATE voice_analyses
       SET processing_status = 'processing',
           processing_started_at = NOW()
       WHERE id = $1`,
      [analysisId]
    );

    await job.progress(20);

    // Step 2: Read audio file and prepare for upload
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    const audioBuffer = fs.readFileSync(audioFilePath);
    const formData = new FormData();
    formData.append('audio_file', audioBuffer, {
      filename: `${analysisId}.wav`,
      contentType: 'audio/wav',
    });
    formData.append('user_id', userId);
    formData.append('analysis_id', analysisId);

    await job.progress(30);

    // Step 3: Send to ML service for analysis
    console.log(`📤 Sending audio to ML service: ${ML_SERVICE_URL}/analyze`);

    const startTime = Date.now();
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze`, formData, {
      headers: {
        ...formData.getHeaders(),
        'X-API-Key': process.env.ML_SERVICE_API_KEY || '', // Optional API key
      },
      timeout: 120000, // 2 minute timeout
      maxContentLength: 50 * 1024 * 1024, // 50MB max
    });

    const processingTimeMs = Date.now() - startTime;
    const mlResult = mlResponse.data;

    await job.progress(70);

    console.log(`✅ Received ML analysis results for ${analysisId} (${processingTimeMs}ms)`);

    // Step 4: Update database with results (enhanced with processing_time_ms tracking)
    await pool.query(
      `UPDATE voice_analyses
       SET processing_status = 'completed',
           processing_completed_at = NOW(),
           primary_emotion = $1,
           emotion_confidence = $2,
           emotion_scores = $3,
           valence = $4,
           arousal = $5,
           dominance = $6,
           wellness_score = $7,
           risk_level = $8,
           transcript = $9,
           acoustic_features = $10,
           linguistic_features = $11,
           stress_indicators = $12,
           crisis_keywords = $13,
           model_version = $14,
           processing_time_ms = $15
       WHERE id = $16`,
      [
        mlResult.primary_emotion,
        mlResult.emotion_confidence,
        JSON.stringify(mlResult.emotion_scores || {}),
        mlResult.valence,
        mlResult.arousal,
        mlResult.dominance,
        mlResult.wellness_score,
        mlResult.risk_level || 'low',
        mlResult.transcript,
        JSON.stringify(mlResult.acoustic_features || {}),
        JSON.stringify(mlResult.linguistic_features || {}),
        JSON.stringify(mlResult.stress_indicators || {}),
        mlResult.crisis_keywords || [],
        mlResult.model_version || '1.0.0',
        processingTimeMs,
        analysisId,
      ]
    );

    await job.progress(90);

    // Step 5: Handle crisis detection (enhanced with emergency contact notification)
    if (mlResult.risk_level === 'high' || mlResult.risk_level === 'critical') {
      await handleCrisisDetection(userId, analysisId, mlResult);

      // Notify emergency contacts if risk level is critical
      if (mlResult.risk_level === 'critical') {
        await notifyEmergencyContacts(userId, analysisId, mlResult);
      }
    }

    // Step 6: Check user settings for auto-delete audio
    const { rows: settings } = await pool.query(
      'SELECT auto_delete_audio, retain_features_only FROM voice_user_settings WHERE user_id = $1',
      [userId]
    );

    if (settings[0]?.auto_delete_audio && settings[0]?.retain_features_only) {
      // Delete audio file after successful analysis
      try {
        fs.unlinkSync(audioFilePath);
        console.log(`🗑️ Deleted audio file (retain_features_only enabled): ${audioFilePath}`);
      } catch (err) {
        console.error(`Failed to delete audio file: ${audioFilePath}`, err);
      }
    }

    await job.progress(100);

    const result: VoiceAnalysisJobResult = {
      analysisId,
      status: 'completed',
      primaryEmotion: mlResult.primary_emotion,
      emotionConfidence: mlResult.emotion_confidence,
      emotionScores: mlResult.emotion_scores,
      valence: mlResult.valence,
      arousal: mlResult.arousal,
      dominance: mlResult.dominance,
      wellnessScore: mlResult.wellness_score,
      riskLevel: mlResult.risk_level,
      transcript: mlResult.transcript,
      acousticFeatures: mlResult.acoustic_features,
      linguisticFeatures: mlResult.linguistic_features,
      stressIndicators: mlResult.stress_indicators,
      crisisKeywords: mlResult.crisis_keywords,
      processingTimeMs,
    };

    console.log(`✅ Voice analysis completed successfully: ${analysisId}`);
    return result;

  } catch (error: any) {
    console.error(`❌ Voice analysis failed: ${analysisId}`, error);

    // Update database with error
    await pool.query(
      `UPDATE voice_analyses
       SET processing_status = 'failed',
           processing_error = $1
       WHERE id = $2`,
      [error.message, analysisId]
    );

    throw error; // Re-throw to mark job as failed
  }
}

/**
 * Handle crisis detection
 * Enhanced to evaluate risk_level and crisis_keywords for severity assessment
 * Triggers alerts and creates crisis event records
 */
async function handleCrisisDetection(
  userId: string,
  analysisId: string,
  mlResult: any
) {
  const severity = mlResult.risk_level || 'medium';
  console.warn(`🚨 Crisis detected for user ${userId} in analysis ${analysisId} (severity: ${severity})`);

  try {
    // Enhance crisis detection with keyword analysis
    const crisisKeywords = mlResult.crisis_keywords || [];
    const criticalKeywords = ['suicide', 'kill', 'self-harm', 'harm myself', 'end it'];
    const highKeywords = ['hopeless', 'worthless', 'can\'t go on', 'give up'];

    const hasCriticalKeyword = crisisKeywords.some((kw: string) =>
      criticalKeywords.some(ck => kw.toLowerCase().includes(ck.toLowerCase()))
    );

    const hasHighKeyword = crisisKeywords.some((kw: string) =>
      highKeywords.some(hk => kw.toLowerCase().includes(hk.toLowerCase()))
    );

    // Determine actual severity based on risk_level + crisis_keywords
    let actualSeverity = severity;
    if (hasCriticalKeyword) {
      actualSeverity = 'critical';
    } else if (hasHighKeyword && severity === 'high') {
      actualSeverity = 'critical';
    }

    // Create crisis event record with detailed context
    const { rows: crisisEvent } = await pool.query(
      `INSERT INTO crisis_events (
        user_id,
        trigger_source,
        severity,
        detected_at,
        context_data
      ) VALUES ($1, $2, $3, NOW(), $4)
      RETURNING id`,
      [
        userId,
        'voice_analysis',
        actualSeverity,
        JSON.stringify({
          analysis_id: analysisId,
          risk_level: mlResult.risk_level,
          crisis_keywords: crisisKeywords,
          wellness_score: mlResult.wellness_score,
          primary_emotion: mlResult.primary_emotion,
          transcript_preview: mlResult.transcript?.substring(0, 200) || '',
          valence: mlResult.valence,
          arousal: mlResult.arousal,
          dominance: mlResult.dominance,
          has_critical_keywords: hasCriticalKeyword,
          has_high_keywords: hasHighKeyword,
        }),
      ]
    );

    if (crisisEvent.length > 0) {
      console.log(`✅ Crisis event logged for user ${userId} with severity: ${actualSeverity}`);
    }

    // TODO: Trigger notifications to user (in-app alert, SMS, email)
    // TODO: Show crisis resources in UI
    // TODO: Alert platform administrators if critical

  } catch (error) {
    console.error('Failed to log crisis event:', error);
  }
}

/**
 * Notify emergency contacts if critical risk level detected
 * Sends alerts to configured emergency contacts with safety summary
 */
async function notifyEmergencyContacts(
  userId: string,
  analysisId: string,
  mlResult: any
) {
  console.log(`📢 Notifying emergency contacts for user ${userId} (critical risk)`);

  try {
    // Get emergency contacts (if table exists)
    const { rows: contacts } = await pool.query(
      `SELECT id, name, email, phone_number
       FROM emergency_contacts
       WHERE user_id = $1 AND is_active = true
       LIMIT 5`,
      [userId]
    );

    if (contacts.length === 0) {
      console.log(`ℹ️  No emergency contacts configured for user ${userId}`);
      return;
    }

    // Get user info for context
    const { rows: userRows } = await pool.query(
      `SELECT email, first_name FROM users WHERE id = $1`,
      [userId]
    );

    const user = userRows[0];

    // Prepare notification message
    const notificationData = {
      userId,
      analysisId,
      timestamp: new Date().toISOString(),
      riskLevel: mlResult.risk_level,
      crisisKeywords: mlResult.crisis_keywords,
      wellnessScore: mlResult.wellness_score,
      primaryEmotion: mlResult.primary_emotion,
      userName: user?.first_name || 'User',
      userEmail: user?.email || '',
    };

    // Log emergency contact notifications
    for (const contact of contacts) {
      await pool.query(
        `INSERT INTO emergency_notifications (
          user_id,
          contact_id,
          analysis_id,
          notification_type,
          status,
          sent_at,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
        [
          userId,
          contact.id,
          analysisId,
          'critical_risk_alert',
          'pending', // Will be marked as 'sent' by notification service
          JSON.stringify({
            recipient_name: contact.name,
            recipient_email: contact.email,
            recipient_phone: contact.phone_number,
            ...notificationData,
          }),
        ]
      );

      console.log(
        `✅ Emergency notification queued for contact: ${contact.name} (${contact.email})`
      );
    }

    // TODO: Trigger actual notification delivery (email, SMS, push notification)
    // This should be handled by a separate notification service
    // For now, we're just logging to database for the notification service to pick up

  } catch (error) {
    console.error('Failed to notify emergency contacts:', error);
    // Don't re-throw - we don't want notification failure to fail the job
  }
}

export default processVoiceAnalysis;
