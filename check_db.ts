
import { pool } from './server/db';

async function checkTables() {
    try {
        const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables:', res.rows.map(r => r.table_name));

        // Check user_activity_completions specifically
        const completionTable = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_activity_completions'
    `);
        console.log('user_activity_completions columns:', completionTable.rows);

    } catch (err) {
        console.error('Error checking tables:', err);
    } finally {
        process.exit();
    }
}

checkTables();
