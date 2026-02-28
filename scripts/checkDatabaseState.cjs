const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://home-aaars@localhost:5432/puresoul'
});

async function checkDatabaseState() {
  console.log('🔍 Checking database state...\n');

  try {
    // Check if users table exists
    const { rows: usersTables } = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);
    console.log('✅ users table exists:', usersTables[0].exists);

    // Check if voice_realtime_sessions table exists
    const { rows: realtimeTables } = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'voice_realtime_sessions'
      );
    `);
    console.log('✅ voice_realtime_sessions table exists:', realtimeTables[0].exists);

    // Check if enum type exists
    const { rows: enumTypes } = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_type
        WHERE typname = 'realtime_session_status'
      );
    `);
    console.log('✅ realtime_session_status enum exists:', enumTypes[0].exists);

    // If table exists, check its structure
    if (realtimeTables[0].exists) {
      const { rows: columns } = await pool.query(`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'voice_realtime_sessions'
        ORDER BY ordinal_position;
      `);
      console.log('\n📊 voice_realtime_sessions columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.udt_name})`);
      });
    }

    // List all tables
    const { rows: allTables } = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    console.log('\n📋 All tables in database:');
    allTables.forEach(t => console.log(`  - ${t.tablename}`));

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkDatabaseState();
