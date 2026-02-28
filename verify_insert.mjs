import { drizzle } from 'drizzle-orm/neon-serverless';
import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    // Get a valid user_id
    const userRes = await pool.query(`SELECT id FROM users LIMIT 1;`);
    const userId = userRes.rows[0].id;

    console.log("Testing insert with userId:", userId);
    
    // Try to insert
    const insertRes = await pool.query(
      `INSERT INTO chat_conversations (user_id, title, mood_before)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, 'Test Title', null]
    );

    console.log("Insert Success! Output:", insertRes.rows[0]);

    // Clean up
    await pool.query(`DELETE FROM chat_conversations WHERE id = $1`, [insertRes.rows[0].id]);
    
    process.exit(0);
  } catch (e) {
    console.error("DB Error Crash:", e);
    process.exit(1);
  }
}
check();
