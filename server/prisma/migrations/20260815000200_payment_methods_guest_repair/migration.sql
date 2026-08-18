-- Payment method management: UPI-first billing with one default method.
ALTER TABLE "payment_methods" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'UPI';
ALTER TABLE "payment_methods" ADD COLUMN IF NOT EXISTS "upiId" TEXT;
ALTER TABLE "payment_methods" ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- Keep at most one default payment method.
WITH first_method AS (
  SELECT id FROM payment_methods WHERE "isActive" = true ORDER BY "createdAt" ASC LIMIT 1
)
UPDATE payment_methods pm
SET "isDefault" = true
WHERE pm.id IN (SELECT id FROM first_method)
  AND NOT EXISTS (SELECT 1 FROM payment_methods WHERE "isDefault" = true AND "isActive" = true);

-- Production deployments may not run the seed script. Ensure the guest role exists
-- so public invite links can always create temporary guest accounts.
INSERT INTO roles (id, name, description, created_at, updated_at)
VALUES (gen_random_uuid(), 'guest', 'Temporary read-only public group guest', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- Guest read-only permissions.
INSERT INTO permissions (id, name, description, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'rooms.read', 'Read rooms', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'messages.read', 'Read messages', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'notifications.read', 'Read notifications', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'search.read', 'Search users', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.name IN ('rooms.read','messages.read','notifications.read','search.read')
WHERE r.name='guest'
ON CONFLICT DO NOTHING;

-- Remove send-message capability from guests so the restriction is also persisted in RBAC.
DELETE FROM role_permissions rp USING roles r, permissions p
WHERE rp.role_id=r.id AND rp.permission_id=p.id AND r.name='guest' AND p.name IN ('messages.create','messages.update','messages.delete');
