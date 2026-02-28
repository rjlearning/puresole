import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireAuth } from '../multiAuth';
import { deleteAllUserAudio } from '../services/audioStorage';

const router = Router();

/**
 * GET /api/voice/settings
 * Get user's voice analysis settings
 */
router.get('/voice/settings', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    const { rows } = await pool.query(
      'SELECT * FROM voice_user_settings WHERE user_id = $1',
      [user.id]
    );

    if (rows.length === 0) {
      // Create default settings
      const { rows: newSettings } = await pool.query(
        `INSERT INTO voice_user_settings (user_id)
         VALUES ($1)
         RETURNING *`,
        [user.id]
      );
      return res.json(newSettings[0]);
    }

    res.json(rows[0]);

  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      error: 'Failed to fetch settings',
      details: error.message,
    });
  }
});

/**
 * PUT /api/voice/settings
 * Update user's voice analysis settings
 */
router.put('/voice/settings', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const {
      enable_recording_analysis,
      enable_realtime_analysis,
      auto_analyze_journal,
      show_emotion_insights,
      enable_crisis_monitoring,
      crisis_alert_threshold,
      notify_on_wellness_drop,
      wellness_drop_threshold,
      data_retention_days,
      auto_delete_audio,
      retain_features_only,
      share_with_therapist,
      therapist_can_view_transcripts,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO voice_user_settings (
        user_id,
        enable_recording_analysis,
        enable_realtime_analysis,
        auto_analyze_journal,
        show_emotion_insights,
        enable_crisis_monitoring,
        crisis_alert_threshold,
        notify_on_wellness_drop,
        wellness_drop_threshold,
        data_retention_days,
        auto_delete_audio,
        retain_features_only,
        share_with_therapist,
        therapist_can_view_transcripts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (user_id) DO UPDATE SET
        enable_recording_analysis = EXCLUDED.enable_recording_analysis,
        enable_realtime_analysis = EXCLUDED.enable_realtime_analysis,
        auto_analyze_journal = EXCLUDED.auto_analyze_journal,
        show_emotion_insights = EXCLUDED.show_emotion_insights,
        enable_crisis_monitoring = EXCLUDED.enable_crisis_monitoring,
        crisis_alert_threshold = EXCLUDED.crisis_alert_threshold,
        notify_on_wellness_drop = EXCLUDED.notify_on_wellness_drop,
        wellness_drop_threshold = EXCLUDED.wellness_drop_threshold,
        data_retention_days = EXCLUDED.data_retention_days,
        auto_delete_audio = EXCLUDED.auto_delete_audio,
        retain_features_only = EXCLUDED.retain_features_only,
        share_with_therapist = EXCLUDED.share_with_therapist,
        therapist_can_view_transcripts = EXCLUDED.therapist_can_view_transcripts,
        updated_at = NOW()
      RETURNING *`,
      [
        user.id,
        enable_recording_analysis,
        enable_realtime_analysis,
        auto_analyze_journal,
        show_emotion_insights,
        enable_crisis_monitoring,
        crisis_alert_threshold,
        notify_on_wellness_drop,
        wellness_drop_threshold,
        data_retention_days,
        auto_delete_audio,
        retain_features_only,
        share_with_therapist,
        therapist_can_view_transcripts,
      ]
    );

    res.json(rows[0]);

  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      error: 'Failed to update settings',
      details: error.message,
    });
  }
});

/**
 * POST /api/voice/consent
 * Grant or revoke consent for voice analysis
 */
router.post('/voice/consent', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { consent_given, consent_version = '1.0.0' } = req.body;

    if (typeof consent_given !== 'boolean') {
      return res.status(400).json({ error: 'consent_given must be a boolean' });
    }

    const { rows } = await pool.query(
      `INSERT INTO voice_user_settings (
        user_id,
        consent_given,
        consent_date,
        consent_version,
        privacy_policy_accepted
      ) VALUES ($1, $2, NOW(), $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        consent_given = EXCLUDED.consent_given,
        consent_date = NOW(),
        consent_version = EXCLUDED.consent_version,
        updated_at = NOW()
      RETURNING *`,
      [user.id, consent_given, consent_version, consent_given]
    );

    res.json({
      message: consent_given ? 'Consent granted' : 'Consent revoked',
      settings: rows[0],
    });

  } catch (error: any) {
    console.error('Error updating consent:', error);
    res.status(500).json({
      error: 'Failed to update consent',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/voice/data
 * Delete all voice data for the user
 */
router.delete('/voice/data', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    // Delete all audio files
    const audioFilesDeleted = await deleteAllUserAudio(user.id);

    // Delete all analysis records (cascades to trends, sessions, correlations)
    const { rowCount } = await pool.query(
      'DELETE FROM voice_analyses WHERE user_id = $1',
      [user.id]
    );

    // Reset consent
    await pool.query(
      `UPDATE voice_user_settings
       SET consent_given = false,
           enable_recording_analysis = false,
           enable_realtime_analysis = false
       WHERE user_id = $1`,
      [user.id]
    );

    res.json({
      message: 'All voice data deleted successfully',
      analyses_deleted: rowCount,
      audio_files_deleted: audioFilesDeleted,
    });

  } catch (error: any) {
    console.error('Error deleting voice data:', error);
    res.status(500).json({
      error: 'Failed to delete voice data',
      details: error.message,
    });
  }
});

export default router;
