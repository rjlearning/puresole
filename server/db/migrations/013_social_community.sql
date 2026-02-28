-- Phase 8 Feature 5: Social & Community Features
-- Creates tables for peer support, groups, forums, and social connections

-- User Profiles (extended social information)
CREATE TABLE IF NOT EXISTS user_social_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(500),
  interests TEXT[],
  preferred_pronouns VARCHAR(50),
  is_mentor BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  last_active_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_social_profiles_user ON user_social_profiles(user_id);

-- Support Groups
CREATE TABLE IF NOT EXISTS support_groups (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  group_type VARCHAR(50) DEFAULT 'open', -- 'open', 'closed', 'private'
  category VARCHAR(100), -- 'anxiety', 'depression', 'addiction', 'grief', etc.
  created_by VARCHAR NOT NULL REFERENCES users(id),
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  meeting_schedule VARCHAR(255),
  guidelines TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_groups_category ON support_groups(category, is_active);
CREATE INDEX IF NOT EXISTS idx_support_groups_created_by ON support_groups(created_by);

-- Group Memberships
CREATE TABLE IF NOT EXISTS group_memberships (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_id VARCHAR NOT NULL REFERENCES support_groups(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'admin', 'moderator', 'member'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'pending', 'banned'
  joined_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_memberships_group ON group_memberships(group_id, status);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user ON group_memberships(user_id, status);

-- Group Posts
CREATE TABLE IF NOT EXISTS group_posts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_id VARCHAR NOT NULL REFERENCES support_groups(id) ON DELETE CASCADE,
  author_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  reply_to_id VARCHAR REFERENCES group_posts(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_moderated BOOLEAN DEFAULT false,
  moderation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_posts_group ON group_posts(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_posts_author ON group_posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_posts_reply_to ON group_posts(reply_to_id);

-- Post Reactions
CREATE TABLE IF NOT EXISTS post_reactions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id VARCHAR NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) DEFAULT 'like', -- 'like', 'support', 'hug', 'helpful'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);

-- Peer Connections (friend/support connections)
CREATE TABLE IF NOT EXISTS peer_connections (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  requester_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'blocked'
  connection_type VARCHAR(50) DEFAULT 'support', -- 'support', 'mentor', 'friend'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_peer_connections_requester ON peer_connections(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_peer_connections_addressee ON peer_connections(addressee_id, status);

-- Direct Messages
CREATE TABLE IF NOT EXISTS direct_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id, is_read, created_at DESC);

-- Community Events
CREATE TABLE IF NOT EXISTS community_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50), -- 'workshop', 'meetup', 'webinar', 'support_circle'
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  location VARCHAR(500), -- Physical or virtual (URL)
  is_virtual BOOLEAN DEFAULT true,
  organizer_id VARCHAR NOT NULL REFERENCES users(id),
  max_attendees INTEGER,
  attendee_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_events_start_time ON community_events(start_time, is_active);
CREATE INDEX IF NOT EXISTS idx_community_events_organizer ON community_events(organizer_id);

-- Event Registrations
CREATE TABLE IF NOT EXISTS event_registrations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id VARCHAR NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'attended', 'cancelled'
  registered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_social_community_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_social_profiles_updated_at_trigger
  BEFORE UPDATE ON user_social_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_social_community_updated_at();

CREATE TRIGGER support_groups_updated_at_trigger
  BEFORE UPDATE ON support_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_social_community_updated_at();

CREATE TRIGGER group_posts_updated_at_trigger
  BEFORE UPDATE ON group_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_community_updated_at();
