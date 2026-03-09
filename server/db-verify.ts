import { sql } from 'drizzle-orm';
import { db } from './db';
import { log } from './vite';

export async function verifySchema() {
    log("Starting database schema verification...");

    try {
        // 1. Check for 'gender' column in 'users' table
        const columns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'gender'
    `);

        if (columns.rows.length === 0) {
            log("Column 'gender' is missing from 'users' table. attempting to add it...");
            await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20)`);
            log("Successfully added 'gender' column to 'users' table.");
        } else {
            log("'gender' column already exists in 'users' table.");
        }

        // 2. Check for other PULSE Expert fields just in case
        const otherColumns = ['birth_year', 'physical_pain_points', 'clinical_history', 'dietary_preferences', 'primary_mood_struggle'];
        for (const col of otherColumns) {
            const check = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = ${col}
      `);

            if (check.rows.length === 0) {
                log(`Column '${col}' is missing. adding it...`);
                if (col === 'birth_year') {
                    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_year INTEGER`);
                } else if (col === 'primary_mood_struggle') {
                    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_mood_struggle VARCHAR(100)`);
                } else {
                    // JSONB columns
                    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${sql.raw(col)} JSONB DEFAULT '[]'::jsonb`);
                }
                log(`Successfully added '${col}' column.`);
            }
        }

        log("Database schema verification completed successfully.");
    } catch (error) {
        console.error("Critical error during database schema verification:", error);
        // We don't throw here to allow the server to at least try to start, 
        // unless it's a connection error that would break everything anyway.
    }
}
