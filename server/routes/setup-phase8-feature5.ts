import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

router.post('/setup/phase8-feature5', async (req: Request, res: Response) => {
  try {
    console.log('Running Phase 8 Feature 5 migration (Social & Community)...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_social_profiles (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        display_name VARCHAR(100),
        bio TEXT,
        avatar_url VARCHAR(500),
        interests TEXT[],
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ User social profiles table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_groups (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        group_type VARCHAR(50) DEFAULT 'open',
        category VARCHAR(100),
        created_by VARCHAR NOT NULL REFERENCES users(id),
        member_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Support groups table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_memberships (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        group_id VARCHAR NOT NULL REFERENCES support_groups(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member',
        status VARCHAR(50) DEFAULT 'active',
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(group_id, user_id)
      )
    `);
    console.log('✅ Group memberships table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_posts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        group_id VARCHAR NOT NULL REFERENCES support_groups(id) ON DELETE CASCADE,
        author_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_anonymous BOOLEAN DEFAULT false,
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_group_posts_group ON group_posts(group_id, created_at DESC)`);
    console.log('✅ Group posts table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS community_events (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_type VARCHAR(50),
        start_time TIMESTAMP NOT NULL,
        organizer_id VARCHAR NOT NULL REFERENCES users(id),
        attendee_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Community events table created');

    res.json({
      message: '✅ Phase 8 Feature 5 (Social & Community) tables created successfully!',
      tables: ['user_social_profiles', 'support_groups', 'group_memberships', 'group_posts', 'community_events']
    });
  } catch (error: any) {
    console.error('❌ Phase 8 Feature 5 migration error:', error);
    res.status(500).json({ error: 'Failed to run Phase 8 Feature 5 migration', details: error.message });
  }
});

export default router;
