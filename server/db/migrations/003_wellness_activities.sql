-- Phase 3: Wellness Activities & Gamification
-- Creates activities library and user tracking

CREATE TABLE IF NOT EXISTS wellness_activities (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'breathing', 'meditation', 'journaling', 'movement', 'grounding'
  difficulty VARCHAR(20) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  duration INTEGER NOT NULL, -- in minutes
  instructions TEXT NOT NULL,
  benefits TEXT,
  icon_emoji VARCHAR(10) DEFAULT '🧘',
  gradient_class VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_activity_completions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id VARCHAR NOT NULL REFERENCES wellness_activities(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT NOW(),
  duration_actual INTEGER, -- actual minutes spent
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  badge_emoji VARCHAR(10) DEFAULT '🏆',
  points INTEGER DEFAULT 0,
  tier VARCHAR(20) DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id VARCHAR PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_activities INTEGER DEFAULT 0,
  total_voice_entries INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  last_activity_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activities_category ON wellness_activities(category);
CREATE INDEX IF NOT EXISTS idx_user_completions_user ON user_activity_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_completions_activity ON user_activity_completions(activity_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- Seed wellness activities
INSERT INTO wellness_activities (name, description, category, difficulty, duration, instructions, benefits, icon_emoji) VALUES
  ('Box Breathing', 'Calm your nervous system with this simple breathing technique', 'breathing', 'beginner', 5,
   'Breathe in for 4 counts, hold for 4, breathe out for 4, hold for 4. Repeat for 5 minutes.',
   'Reduces stress and anxiety, improves focus, calms the nervous system', '🫁'),

  ('4-7-8 Breathing', 'Sleep-promoting breathing exercise', 'breathing', 'beginner', 5,
   'Breathe in for 4 counts, hold for 7, exhale slowly for 8. Repeat 4 times.',
   'Promotes relaxation, helps with sleep, reduces anxiety', '😮‍💨'),

  ('Morning Meditation', 'Start your day with mindfulness', 'meditation', 'beginner', 10,
   'Sit comfortably, close your eyes, focus on your breath. When thoughts arise, gently return focus to breathing.',
   'Increases focus, reduces stress, improves mood throughout the day', '🧘'),

  ('Body Scan', 'Progressive relaxation technique', 'meditation', 'intermediate', 15,
   'Lie down, close eyes. Focus attention on each body part from toes to head, noticing sensations without judgment.',
   'Releases physical tension, improves body awareness, promotes deep relaxation', '🛌'),

  ('Gratitude Journaling', 'Write down what you\'re grateful for', 'journaling', 'beginner', 5,
   'Write 3-5 things you\'re grateful for today. Be specific and notice how each one makes you feel.',
   'Shifts perspective to positive, improves mood, builds resilience', '📝'),

  ('Evening Reflection', 'Process your day mindfully', 'journaling', 'beginner', 10,
   'Answer: What went well today? What challenged me? What did I learn? What am I grateful for?',
   'Improves self-awareness, processes emotions, identifies growth', '🌙'),

  ('Nature Walk', 'Mindful outdoor movement', 'movement', 'beginner', 15,
   'Walk outside at comfortable pace. Notice sounds, smells, sights. Leave phone behind if possible.',
   'Boosts mood, reduces rumination, increases energy, connects with nature', '🚶'),

  ('Gentle Stretching', 'Release physical tension', 'movement', 'beginner', 10,
   'Stretch major muscle groups gently. Hold each stretch 20-30 seconds. Focus on breath and release.',
   'Reduces physical tension, improves flexibility, increases body awareness', '🤸'),

  ('5-4-3-2-1 Grounding', 'Anchor yourself in the present', 'grounding', 'beginner', 5,
   'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.',
   'Stops anxiety spiral, grounds in present moment, calms panic', '🌳'),

  ('Progressive Muscle Relaxation', 'Systematic tension release', 'grounding', 'intermediate', 15,
   'Tense each muscle group for 5 seconds, then release. Start with feet, move up to face.',
   'Releases deep tension, improves sleep, reduces physical stress', '💆'),

  ('Loving-Kindness Meditation', 'Cultivate compassion for self and others', 'meditation', 'intermediate', 10,
   'Silently repeat: "May I be happy, may I be healthy, may I be safe." Then extend to others.',
   'Increases self-compassion, improves relationships, reduces negative self-talk', '❤️'),

  ('Morning Pages', 'Stream of consciousness writing', 'journaling', 'intermediate', 15,
   'Write 3 pages of whatever comes to mind. Don\'t edit, judge, or stop. Just write.',
   'Clears mental clutter, surfaces insights, processes emotions', '📖'),

  ('Mindful Tea/Coffee', 'Transform routine into ritual', 'grounding', 'beginner', 10,
   'Prepare drink slowly. Notice each sensation: warmth, aroma, taste. Sip mindfully.',
   'Brings presence to daily routine, creates calm moments, sensory awareness', '☕'),

  ('Energy Dance', 'Move to release stuck energy', 'movement', 'beginner', 10,
   'Put on music you love. Move however your body wants to. No judgment, just expression.',
   'Releases stuck emotions, boosts energy, improves mood instantly', '💃'),

  ('Evening Wind-Down', 'Prepare body and mind for sleep', 'grounding', 'beginner', 15,
   'Dim lights, avoid screens. Do gentle stretches, slow breathing, read something calming.',
   'Improves sleep quality, signals bedtime to body, reduces nighttime anxiety', '🌙')
ON CONFLICT (id) DO NOTHING;

-- Seed achievements
INSERT INTO achievements (code, name, description, badge_emoji, points, tier) VALUES
  ('first_activity', 'First Step', 'Complete your first wellness activity', '🌟', 10, 'bronze'),
  ('week_streak', 'Week Warrior', 'Maintain a 7-day activity streak', '🔥', 50, 'silver'),
  ('month_streak', 'Monthly Master', 'Maintain a 30-day activity streak', '⭐', 200, 'gold'),
  ('voice_journal_10', 'Voice of Wisdom', 'Complete 10 voice journal entries', '🎤', 50, 'silver'),
  ('activities_50', 'Wellness Champion', 'Complete 50 wellness activities', '🏆', 100, 'gold'),
  ('meditation_master', 'Zen Master', 'Complete 20 meditation sessions', '🧘', 75, 'gold'),
  ('early_bird', 'Early Bird', 'Complete morning activity before 8 AM', '🌅', 25, 'bronze'),
  ('night_owl', 'Night Owl', 'Complete evening reflection after 9 PM', '🦉', 25, 'bronze'),
  ('consistency_king', 'Consistency King', 'Complete at least one activity every day for 100 days', '👑', 500, 'platinum'),
  ('self_care_advocate', 'Self-Care Advocate', 'Complete activities in all 5 categories', '💚', 100, 'gold')
ON CONFLICT (code) DO NOTHING;

SELECT 'Phase 3: Wellness activities and gamification tables created successfully!' as message;
SELECT COUNT(*) as activities_count FROM wellness_activities;
SELECT COUNT(*) as achievements_count FROM achievements;
