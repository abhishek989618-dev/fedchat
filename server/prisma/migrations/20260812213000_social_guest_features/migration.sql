CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, contact_id uuid NOT NULL,
  nickname text, blocked boolean NOT NULL DEFAULT false, favorite boolean NOT NULL DEFAULT false,
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, contact_id)
);
CREATE INDEX IF NOT EXISTS contacts_user_idx ON contacts(user_id);
CREATE INDEX IF NOT EXISTS contacts_contact_idx ON contacts(contact_id);
CREATE TABLE IF NOT EXISTS contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sender_id uuid NOT NULL, receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'PENDING', created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sender_id, receiver_id)
);
CREATE INDEX IF NOT EXISTS contact_requests_receiver_status_idx ON contact_requests(receiver_id,status);
CREATE TABLE IF NOT EXISTS statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, content text NOT NULL, media_url text, media_type text,
  expires_at timestamp(3) NOT NULL, created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS statuses_user_created_idx ON statuses(user_id,created_at);
CREATE INDEX IF NOT EXISTS statuses_expires_idx ON statuses(expires_at);
CREATE TABLE IF NOT EXISTS status_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), status_id uuid NOT NULL, viewer_id uuid NOT NULL,
  viewed_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(status_id,viewer_id)
);
CREATE TABLE IF NOT EXISTS communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text, owner_id uuid NOT NULL,
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS communities_owner_idx ON communities(owner_id);
CREATE TABLE IF NOT EXISTS community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), community_id uuid NOT NULL, user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'MEMBER', created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(community_id,user_id)
);
CREATE TABLE IF NOT EXISTS community_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), community_id uuid NOT NULL, room_id uuid NOT NULL,
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(community_id,room_id)
);
CREATE TABLE IF NOT EXISTS group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), room_id uuid NOT NULL, token text NOT NULL UNIQUE,
  created_by_id uuid NOT NULL, is_active boolean NOT NULL DEFAULT true, expires_at timestamp(3), created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS group_invites_room_idx ON group_invites(room_id);
CREATE TABLE IF NOT EXISTS guest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, room_id uuid NOT NULL,
  expires_at timestamp(3) NOT NULL, created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS guest_sessions_user_idx ON guest_sessions(user_id);
CREATE INDEX IF NOT EXISTS guest_sessions_room_idx ON guest_sessions(room_id);
CREATE INDEX IF NOT EXISTS guest_sessions_expiry_idx ON guest_sessions(expires_at);
