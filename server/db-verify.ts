import { sql } from 'drizzle-orm';
import { db } from './db';
import { log } from './vite';

export async function verifySchema() {
    log("Starting comprehensive database schema verification...");

    try {
        const userColumns: { name: string, type: string, default?: string }[] = [
            { name: 'postpartum_delivery_date', type: 'TIMESTAMP' },
            { name: 'postpartum_delivery_type', type: 'VARCHAR(50)' },
            { name: 'is_breastfeeding', type: 'BOOLEAN', default: 'false' },
            { name: 'weight', type: 'NUMERIC(5, 2)' },
            { name: 'height', type: 'NUMERIC(5, 2)' },
            { name: 'age', type: 'INTEGER' },
            { name: 'activity_level', type: 'VARCHAR(50)' },
            { name: 'fitness_goal', type: 'VARCHAR(50)' },
            { name: 'gender', type: 'VARCHAR(20)' },
            { name: 'birth_year', type: 'INTEGER' },
            { name: 'physical_pain_points', type: 'JSONB', default: "'[]'::jsonb" },
            { name: 'clinical_history', type: 'JSONB', default: "'[]'::jsonb" },
            { name: 'dietary_preferences', type: 'JSONB', default: "'[]'::jsonb" },
            { name: 'allergies', type: 'JSONB', default: "'[]'::jsonb" },
            { name: 'primary_mood_struggle', type: 'VARCHAR(100)' },
            { name: 'assigned_coach_id', type: 'VARCHAR' },
            { name: 'growth_level', type: 'INTEGER', default: '1' },
            { name: 'free_access_until', type: 'TIMESTAMP' },
            { name: 'free_access_note', type: 'TEXT' },
            { name: 'password_reset_token', type: 'VARCHAR' },
            { name: 'password_reset_expires_at', type: 'TIMESTAMP' }
        ];

        for (const col of userColumns) {
            const check = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = ${col.name}
      `);

            if (check.rows.length === 0) {
                log(`Column '${col.name}' is missing in 'users' table. Adding it...`);
                let query = `ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`;
                if (col.default) {
                    query += ` DEFAULT ${col.default}`;
                }
                await db.execute(sql.raw(query));
                log(`Successfully added '${col.name}' column.`);
            }
        }

        log("Database schema verification completed successfully.");
    } catch (error) {
        console.error("Critical error during database schema verification:", error);
    }
}
