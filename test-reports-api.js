// Quick diagnostic script to test reports API
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/puresoul'
});

async function diagnose() {
  console.log('🔍 Diagnosing Phase 6 Week 2 setup...\n');

  try {
    // Check if tables exist
    console.log('Checking database tables...');

    const tables = ['wellness_reports', 'report_access_logs', 'report_templates'];

    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ ${table}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`❌ ${table}: NOT FOUND`);
        console.log(`   Error: ${error.message}`);
      }
    }

    console.log('\n📋 Report templates:');
    const templates = await pool.query('SELECT name, report_type FROM report_templates');
    templates.rows.forEach(t => {
      console.log(`   - ${t.name} (${t.report_type})`);
    });

    console.log('\n✅ Database setup looks good!');
    console.log('\n📝 Next steps:');
    console.log('1. Make sure your server is running: npm run dev');
    console.log('2. Check server logs for any errors');
    console.log('3. Try the API test again in browser console');

  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error.message);
    console.log('\n💡 You need to run the migration first:');
    console.log('   node run-phase6week2-migration.js');
  } finally {
    await pool.end();
  }
}

diagnose();
