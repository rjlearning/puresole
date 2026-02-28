import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// GET /api/integrations - Get all integrations for user
router.get('/integrations', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    const result = await pool.query(
      `SELECT id, provider, is_active, last_sync_at, sync_frequency,
              auto_sync_enabled, connected_at
       FROM integrations
       WHERE user_id = $1
       ORDER BY connected_at DESC`,
      [userId]
    );

    res.json({ integrations: result.rows });
  } catch (error: any) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// POST /api/integrations - Create new integration (simulated)
router.post('/integrations', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { provider, syncFrequency } = req.body;

    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }

    // For demo purposes, create integration without actual OAuth
    const result = await pool.query(
      `INSERT INTO integrations
       (user_id, provider, sync_frequency, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [userId, provider, syncFrequency || 'daily']
    );

    res.json({
      message: 'Integration created',
      integration: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating integration:', error);
    res.status(500).json({ error: 'Failed to create integration' });
  }
});

// PUT /api/integrations/:id - Update integration
router.put('/integrations/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;
    const { isActive, syncFrequency, autoSyncEnabled } = req.body;

    const result = await pool.query(
      `UPDATE integrations
       SET is_active = COALESCE($3, is_active),
           sync_frequency = COALESCE($4, sync_frequency),
           auto_sync_enabled = COALESCE($5, auto_sync_enabled),
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId, isActive, syncFrequency, autoSyncEnabled]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    res.json({
      message: 'Integration updated',
      integration: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating integration:', error);
    res.status(500).json({ error: 'Failed to update integration' });
  }
});

// DELETE /api/integrations/:id - Delete integration
router.delete('/integrations/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM integrations WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    res.json({ message: 'Integration disconnected' });
  } catch (error: any) {
    console.error('Error deleting integration:', error);
    res.status(500).json({ error: 'Failed to delete integration' });
  }
});

// POST /api/integrations/:id/sync - Trigger manual sync
router.post('/integrations/:id/sync', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;

    // Verify ownership
    const integrationCheck = await pool.query(
      'SELECT * FROM integrations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (integrationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const integration = integrationCheck.rows[0];

    // Simulate sync (in production, this would call external APIs)
    const startTime = Date.now();
    const recordsSynced = Math.floor(Math.random() * 50) + 10;

    // Log the sync
    const logResult = await pool.query(
      `INSERT INTO sync_logs
       (integration_id, sync_type, status, records_synced,
        data_types_synced, started_at, completed_at, duration_ms)
       VALUES ($1, 'manual', 'success', $2, $3, NOW(), NOW(), $4)
       RETURNING *`,
      [id, recordsSynced, ['{sleep,steps,heart_rate}'], Date.now() - startTime]
    );

    // Generate sample imported data
    const sampleData = {
      steps: Math.floor(Math.random() * 10000) + 3000,
      sleep_hours: (Math.random() * 4 + 5).toFixed(1),
      heart_rate_avg: Math.floor(Math.random() * 20) + 60
    };

    await pool.query(
      `INSERT INTO imported_data
       (user_id, integration_id, data_type, data, recorded_at, external_id)
       VALUES
       ($1, $2, 'steps', $3, NOW(), $4),
       ($1, $2, 'sleep', $5, NOW(), $6),
       ($1, $2, 'heart_rate', $7, NOW(), $8)
       ON CONFLICT (integration_id, data_type, external_id) DO NOTHING`,
      [
        userId, id,
        JSON.stringify({ value: sampleData.steps, unit: 'steps' }), `ext-${Date.now()}-1`,
        JSON.stringify({ value: sampleData.sleep_hours, unit: 'hours' }), `ext-${Date.now()}-2`,
        JSON.stringify({ value: sampleData.heart_rate_avg, unit: 'bpm' }), `ext-${Date.now()}-3`
      ]
    );

    res.json({
      message: 'Sync completed',
      syncLog: logResult.rows[0],
      recordsSynced
    });
  } catch (error: any) {
    console.error('Error syncing integration:', error);
    res.status(500).json({ error: 'Failed to sync integration' });
  }
});

// GET /api/integrations/:id/data - Get imported data
router.get('/integrations/:id/data', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { id } = req.params;
    const { dataType, limit = 50 } = req.query;

    // Verify ownership
    const integrationCheck = await pool.query(
      'SELECT id FROM integrations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (integrationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    let query = `
      SELECT * FROM imported_data
      WHERE integration_id = $1
    `;
    const params: any[] = [id];

    if (dataType) {
      query += ` AND data_type = $2`;
      params.push(dataType);
    }

    query += ` ORDER BY recorded_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({ data: result.rows });
  } catch (error: any) {
    console.error('Error fetching imported data:', error);
    res.status(500).json({ error: 'Failed to fetch imported data' });
  }
});

// GET /api/data-correlations - Get correlations between imported data and mood
router.get('/data-correlations', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;

    const result = await pool.query(
      `SELECT * FROM data_correlations
       WHERE user_id = $1
       ORDER BY ABS(correlation_coefficient) DESC`,
      [userId]
    );

    res.json({ correlations: result.rows });
  } catch (error: any) {
    console.error('Error fetching correlations:', error);
    res.status(500).json({ error: 'Failed to fetch correlations' });
  }
});

export default router;
