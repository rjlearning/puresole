import { Router } from 'express';
import { pool } from '../db';
import fs from 'fs';
import path from 'path';

const router = Router();

router.post('/setup-goals-enhanced', async (req, res) => {
  try {
    const migrationPath = path.join(__dirname, '../db/migrations/015_goals_tracking.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(sql);

    res.json({ message: 'Goals enhancement tables created successfully' });
  } catch (error: any) {
    console.error('Error setting up goals enhancements:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
