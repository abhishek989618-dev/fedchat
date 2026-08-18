-- Profile customization: banner and bio
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banner_url" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;
