const { readFileSync } = require('fs');
const { join } = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://home-aaars@localhost:5432/puresoul'
});

/**
 * Run Phase III database migration
 */
async function runMigration() {
  console.log('🚀 Starting Phase III database migration...');

  try {
    // Read migration SQL file
    const migrationPath = join(__dirname, '../server/db/migrations/016_voice_realtime_sessions.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded successfully');

    // Execute migration
    await pool.query(migrationSQL);

    console.log('✅ Phase III migration completed successfully!');
    console.log('\nTables created:');
    console.log('  - voice_realtime_sessions');
    console.log('\nEnum types created:');
    console.log('  - realtime_session_status (active, completed, interrupted)');
    console.log('\nUtility functions created:');
    console.log('  - cleanup_old_interrupted_sessions()');
    console.log('  - get_realtime_session_stats()');
    console.log('\nTriggers created:');
    console.log('  - trigger_update_voice_realtime_sessions_updated_at');

    // Verify table was created
    const { rows: tables } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'voice_realtime_sessions'
    `);

    if (tables.length > 0) {
      console.log('\n✅ Verified table exists:', tables[0].table_name);

      // Count indexes
      const { rows: indexes } = await pool.query(`
        SELECT COUNT(*) as index_count
        FROM pg_indexes
        WHERE tablename = 'voice_realtime_sessions'
      `);

      console.log(`✅ Created ${indexes[0].index_count} indexes for performance`);
    } else {
      console.error('❌ Table verification failed!');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
