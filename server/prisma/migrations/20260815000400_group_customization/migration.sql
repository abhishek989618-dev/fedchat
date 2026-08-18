-- Group customization: icon, banner, and existing description support.
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "avatar" TEXT;
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "banner_url" TEXT;
