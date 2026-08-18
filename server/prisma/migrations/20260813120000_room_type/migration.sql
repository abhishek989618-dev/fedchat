-- Distinguish group rooms from direct (1:1) rooms.
DO $$ BEGIN
  CREATE TYPE "RoomType" AS ENUM ('DIRECT', 'GROUP');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "type" "RoomType" NOT NULL DEFAULT 'DIRECT';

CREATE INDEX IF NOT EXISTS "rooms_type_idx" ON "rooms"("type");
