import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// Run Phase 8 Feature 4 migration (Integration Hub)
router.post('/setup/phase8-feature4', async (req: Request, res: Response) => {
  try {
    console.log('Running Phase 8 Feature 4 migration (Integration Hub)...');

    // Integrations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS integrations (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL,
        provider_user_id VARCHAR(255),
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        last_sync_at TIMESTAMP,
        sync_frequency VARCHAR(50) DEFAULT 'daily',
        auto_sync_enabled BOOLEAN DEFAULT true,
        connected_at TIMESTAMP DEFAULT NOW(),
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, provider)
      )
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_integrations_user ON integrations(user_id, is_active)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider, is_active)`);
    console.log('✅ Integrations table created');

    // Imported Data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS imported_data (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        integration_id VARCHAR NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
        data_type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        recorded_at TIMESTAMP NOT NULL,
        imported_at TIMESTAMP DEFAULT NOW(),
        external_id VARCHAR(255),
        UNIQUE(integration_id, data_type, external_id)
      )
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_imported_data_user_type ON imported_data(user_id, data_type, recorded_at DESC)`);
    console.log('✅ Imported data table created');

    // Sync Logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        integration_id VARCHAR NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
        sync_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        records_synced INTEGER DEFAULT 0,
        records_failed INTEGER DEFAULT 0,
        data_types_synced TEXT[],
        error_message TEXT,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        duration_ms INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sync_logs_integration ON sync_logs(integration_id, created_at DESC)`);
    console.log('✅ Sync logs table created');

    // Data Correlations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS data_correlations (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        data_type VARCHAR(50) NOT NULL,
        correlation_with VARCHAR(50) NOT NULL,
        correlation_coefficient DECIMAL(4,3),
        confidence_level DECIMAL(3,2),
        sample_size INTEGER,
        time_period VARCHAR(50),
        calculated_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        insights TEXT,
        UNIQUE(user_id, data_type, correlation_with, time_period)
      )
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_data_correlations_user ON data_correlations(user_id, calculated_at DESC)`);
    console.log('✅ Data correlations table created');

    // Triggers
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_integration_hub_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS integrations_updated_at_trigger ON integrations;
      CREATE TRIGGER integrations_updated_at_trigger
        BEFORE UPDATE ON integrations
        FOR EACH ROW
        EXECUTE FUNCTION update_integration_hub_updated_at()
    `);

    console.log('✅ Triggers created');

    res.json({
      message: '✅ Phase 8 Feature 4 (Integration Hub) tables created successfully!',
      tables: ['integrations', 'imported_data', 'sync_logs', 'data_correlations']
    });
  } catch (error: any) {
    console.error('❌ Phase 8 Feature 4 migration error:', error);
    res.status(500).json({
      error: 'Failed to run Phase 8 Feature 4 migration',
      details: error.message
    });
  }
});

export default router;
