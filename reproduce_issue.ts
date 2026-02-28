
import { pool } from './server/db';

async function testActivityCompletion() {
    const userId = 'test-user-id'; // We might need a real user ID if constraints exist
    const activityId = 'test-activity-id';

    console.log('Testing connection...');
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('Connection successful:', res.rows[0]);

        // 1. Create dummy user if needed (uuid)
        // 2. Create dummy activity if needed (uuid)

        // Attempt insert
        console.log('Attempting insert into user_activity_completions...');
        // We'll just verify the table is writable for now

    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        process.exit();
    }
}

testActivityCompletion();
