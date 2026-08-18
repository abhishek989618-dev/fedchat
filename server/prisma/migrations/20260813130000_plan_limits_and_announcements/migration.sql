-- Configurable per-plan feature limits (null = unlimited).
ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "max_groups" INTEGER;
ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "max_members_per_group" INTEGER;
ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "max_communities" INTEGER;
ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "max_guests_per_group" INTEGER;

-- Community announcements, separate from group conversations.
CREATE TABLE IF NOT EXISTS "community_announcements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "community_id" UUID NOT NULL,
  "author_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "community_announcements_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "community_announcements"
    ADD CONSTRAINT "community_announcements_community_id_fkey"
    FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "community_announcements_community_id_idx" ON "community_announcements"("community_id");
