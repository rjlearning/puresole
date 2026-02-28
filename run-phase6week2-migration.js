// Run Phase 6 Week 2: Wellness Reports Migration
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create pool connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/puresoul'
});

async function runMigration() {
  console.log('🚀 Running Phase 6 Week 2: Wellness Reports Migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'server/db/migrations/007_wellness_reports.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await pool.query(sql);

    console.log('✅ Migration completed successfully!\n');

    // Get counts
    const reportsCount = await pool.query('SELECT COUNT(*) FROM wellness_reports');
    console.log(`📊 Wellness reports table created (current records: ${reportsCount.rows[0].count})`);

    const templatesCount = await pool.query('SELECT COUNT(*) FROM report_templates');
    console.log(`📋 Report templates seeded: ${templatesCount.rows[0].count}`);

    const accessLogsCount = await pool.query('SELECT COUNT(*) FROM report_access_logs');
    console.log(`🔐 Report access logs table created (current records: ${accessLogsCount.rows[0].count})`);

    console.log('\n✨ Phase 6 Week 2 tables are ready!');
    console.log('\n📖 Next steps:');
    console.log('1. Test report generation: POST /api/reports/generate');
    console.log('2. View reports: GET /api/reports');
    console.log('3. Check templates: GET /api/reports/templates');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
