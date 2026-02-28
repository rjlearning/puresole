// Run Phase 6 Crisis Resources Migration
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
  console.log('🚀 Running Phase 6 Crisis Resources Migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'server/db/migrations/006_crisis_resources.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    const result = await pool.query(sql);

    console.log('✅ Migration completed successfully!\n');

    // Get counts
    const crisisCount = await pool.query('SELECT COUNT(*) FROM crisis_resources');
    console.log(`📊 Crisis resources seeded: ${crisisCount.rows[0].count}`);

    const safetyPlansCount = await pool.query('SELECT COUNT(*) FROM safety_plans');
    console.log(`📊 Safety plans table created (current records: ${safetyPlansCount.rows[0].count})`);

    console.log('\n✨ Phase 6 Week 1 tables are ready!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
