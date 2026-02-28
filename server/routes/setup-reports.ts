import { Router, Request, Response } from 'express';
import { pool } from '../db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Admin endpoint to run Phase 6 Week 2 migration
router.post('/setup/reports-migration', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Running Phase 6 Week 2 migration...');

    // Read migration file
    const migrationPath = path.join(__dirname, '../db/migrations/007_wellness_reports.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await pool.query(sql);

    // Get counts
    const reportsCount = await pool.query('SELECT COUNT(*) FROM wellness_reports');
    const templatesCount = await pool.query('SELECT COUNT(*) FROM report_templates');
    const logsCount = await pool.query('SELECT COUNT(*) FROM report_access_logs');

    console.log('✅ Phase 6 Week 2 migration complete!');

    res.json({
      message: 'Migration completed successfully',
      tables: {
        wellness_reports: parseInt(reportsCount.rows[0].count),
        report_templates: parseInt(templatesCount.rows[0].count),
        report_access_logs: parseInt(logsCount.rows[0].count)
      }
    });
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
});

export default router;
