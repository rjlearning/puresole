const { readFileSync } = require('fs');
const { join } = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://home-aaars@localhost:5432/puresoul'
});

/**
 * Run Phase IV database migration
 */
async function runMigration() {
  console.log('🚀 Starting Phase IV database migration...');

  try {
    // Read migration SQL file
    const migrationPath = join(__dirname, '../server/db/migrations/phase4-analytics.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded successfully');

    // Execute migration
    await pool.query(migrationSQL);

    console.log('✅ Phase IV migration completed successfully!');
    console.log('\nTables created:');
    console.log('  - voice_user_baselines');
    console.log('  - voice_predictions');
    console.log('  - analytics_exports');
    console.log('  - user_insights (enhanced)');
    console.log('\nUtility functions created:');
    console.log('  - calculate_z_score()');
    console.log('  - cleanup_expired_predictions()');
    console.log('  - cleanup_expired_exports()');

    // Verify tables were created
    const { rows: tables } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('voice_user_baselines', 'voice_predictions', 'analytics_exports')
      ORDER BY table_name
    `);

    console.log('\n✅ Verified tables:', tables.map(t => t.table_name).join(', '));

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
