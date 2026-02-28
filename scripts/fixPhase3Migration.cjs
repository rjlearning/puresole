const { Pool } = require('pg');
const { readFileSync } = require('fs');
const { join } = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://home-aaars@localhost:5432/puresoul'
});

async function fixAndRunMigration() {
  console.log('🔧 Fixing Phase III migration conflict...\n');

  try {
    // Check if old table has any data
    const { rows: dataCheck } = await pool.query(`
      SELECT COUNT(*) as count FROM voice_realtime_sessions;
    `);

    const hasData = parseInt(dataCheck[0].count) > 0;

    if (hasData) {
      console.log(`⚠️  Found ${dataCheck[0].count} records in existing voice_realtime_sessions table`);
      console.log('📦 Renaming old table to voice_realtime_sessions_legacy...');

      await pool.query(`
        ALTER TABLE voice_realtime_sessions
        RENAME TO voice_realtime_sessions_legacy;
      `);

      console.log('✅ Old table preserved as voice_realtime_sessions_legacy');
    } else {
      console.log('📋 Existing table is empty, dropping it...');

      await pool.query(`DROP TABLE IF EXISTS voice_realtime_sessions CASCADE;`);

      console.log('✅ Old table dropped');
    }

    // Now run the Phase III migration
    console.log('\n🚀 Running Phase III migration...');

    const migrationPath = join(__dirname, '../server/db/migrations/016_voice_realtime_sessions.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    await pool.query(migrationSQL);

    console.log('✅ Phase III migration completed successfully!\n');
    console.log('Tables created:');
    console.log('  - voice_realtime_sessions (new schema for WebSocket streaming)');
    console.log('\nEnum types created:');
    console.log('  - realtime_session_status (active, completed, interrupted)');
    console.log('\nUtility functions created:');
    console.log('  - cleanup_old_interrupted_sessions()');
    console.log('  - get_realtime_session_stats()');

    // Verify new table structure
    const { rows: columns } = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'voice_realtime_sessions'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 New table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    if (hasData) {
      console.log('\n💡 Note: Your old data is preserved in voice_realtime_sessions_legacy');
      console.log('   You can migrate it later if needed, or drop it with:');
      console.log('   DROP TABLE voice_realtime_sessions_legacy CASCADE;');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

fixAndRunMigration();
