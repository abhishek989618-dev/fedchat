-- Repair the 20260813204455_deploy migration without dropping application data.
-- This is intentionally idempotent so it is safe on already-deployed databases.

DO $$
BEGIN
  -- communities
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communities' AND column_name='ownerId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communities' AND column_name='owner_id') THEN
    ALTER TABLE "communities" RENAME COLUMN "ownerId" TO "owner_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communities' AND column_name='createdAt')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communities' AND column_name='created_at') THEN
    ALTER TABLE "communities" RENAME COLUMN "createdAt" TO "created_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communities' AND column_name='updatedAt')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communities' AND column_name='updated_at') THEN
    ALTER TABLE "communities" RENAME COLUMN "updatedAt" TO "updated_at";
  END IF;

  -- contact_requests
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contact_requests' AND column_name='senderId') THEN
    ALTER TABLE "contact_requests" RENAME COLUMN "senderId" TO "sender_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contact_requests' AND column_name='receiverId') THEN
    ALTER TABLE "contact_requests" RENAME COLUMN "receiverId" TO "receiver_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contact_requests' AND column_name='createdAt') THEN
    ALTER TABLE "contact_requests" RENAME COLUMN "createdAt" TO "created_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contact_requests' AND column_name='updatedAt') THEN
    ALTER TABLE "contact_requests" RENAME COLUMN "updatedAt" TO "updated_at";
  END IF;

  -- group_invites
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='group_invites' AND column_name='roomId') THEN
    ALTER TABLE "group_invites" RENAME COLUMN "roomId" TO "room_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='group_invites' AND column_name='createdById') THEN
    ALTER TABLE "group_invites" RENAME COLUMN "createdById" TO "created_by_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='group_invites' AND column_name='isActive') THEN
    ALTER TABLE "group_invites" RENAME COLUMN "isActive" TO "is_active";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='group_invites' AND column_name='expiresAt') THEN
    ALTER TABLE "group_invites" RENAME COLUMN "expiresAt" TO "expires_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='group_invites' AND column_name='createdAt') THEN
    ALTER TABLE "group_invites" RENAME COLUMN "createdAt" TO "created_at";
  END IF;

  -- guest_sessions
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guest_sessions' AND column_name='userId') THEN
    ALTER TABLE "guest_sessions" RENAME COLUMN "userId" TO "user_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guest_sessions' AND column_name='roomId') THEN
    ALTER TABLE "guest_sessions" RENAME COLUMN "roomId" TO "room_id";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guest_sessions' AND column_name='expiresAt') THEN
    ALTER TABLE "guest_sessions" RENAME COLUMN "expiresAt" TO "expires_at";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guest_sessions' AND column_name='createdAt') THEN
    ALTER TABLE "guest_sessions" RENAME COLUMN "createdAt" TO "created_at";
  END IF;

  -- statuses / status_views
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='statuses' AND column_name='userId') THEN ALTER TABLE "statuses" RENAME COLUMN "userId" TO "user_id"; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='statuses' AND column_name='mediaUrl') THEN ALTER TABLE "statuses" RENAME COLUMN "mediaUrl" TO "media_url"; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='statuses' AND column_name='mediaType') THEN ALTER TABLE "statuses" RENAME COLUMN "mediaType" TO "media_type"; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='statuses' AND column_name='expiresAt') THEN ALTER TABLE "statuses" RENAME COLUMN "expiresAt" TO "expires_at"; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='statuses' AND column_name='createdAt') THEN ALTER TABLE "statuses" RENAME COLUMN "createdAt" TO "created_at"; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='status_views' AND column_name='statusId') THEN ALTER TABLE "status_views" RENAME COLUMN "statusId" TO "status_id"; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='status_views' AND column_name='viewerId') THEN ALTER TABLE "status_views" RENAME COLUMN "viewerId" TO "viewer_id"; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='status_views' AND column_name='viewedAt') THEN ALTER TABLE "status_views" RENAME COLUMN "viewedAt" TO "viewed_at"; END IF;
END $$;

-- Legacy databases may not have updated_at at all. Create it before touching defaults.
DO $$
BEGIN
  IF to_regclass('public.communities') IS NOT NULL THEN
    ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3);
    ALTER TABLE "communities" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
    UPDATE "communities" SET "updated_at" = COALESCE("updated_at", "created_at", CURRENT_TIMESTAMP) WHERE "updated_at" IS NULL;
  END IF;

  IF to_regclass('public.contact_requests') IS NOT NULL THEN
    ALTER TABLE "contact_requests" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3);
    ALTER TABLE "contact_requests" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
    UPDATE "contact_requests" SET "updated_at" = COALESCE("updated_at", "created_at", CURRENT_TIMESTAMP) WHERE "updated_at" IS NULL;
  END IF;

  IF to_regclass('public.community_announcements') IS NOT NULL THEN
    ALTER TABLE "community_announcements" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3);
    ALTER TABLE "community_announcements" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
    UPDATE "community_announcements" SET "updated_at" = COALESCE("updated_at", "created_at", CURRENT_TIMESTAMP) WHERE "updated_at" IS NULL;
  END IF;
END $$;
