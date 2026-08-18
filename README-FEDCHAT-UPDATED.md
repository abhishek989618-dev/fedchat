# FedChat — Updated Build

This package contains a cleaned source build of the FedChat messaging platform.

## What was fixed

- Realtime chat now consumes message create, edit, delete, reaction, delivery/read receipt and conversation-sidebar events.
- Duplicate message handling was removed by separating room messages from sidebar conversation updates.
- Typing indicators are scoped to the correct room.
- Mobile chat navigation and empty/loading states were improved.
- New conversation search has a professional modal flow and filters out the current user.
- Conversation search, refresh, responsive composer, message-state indicators and richer empty states were added.
- Express now trusts the first reverse-proxy hop so Cloudflare/Railway style `X-Forwarded-For` traffic works correctly with rate limiting.
- Vite accepts Cloudflare Quick Tunnel hosts during local development.
- Generated `dist`, `node_modules`, uploads and local `.env` files are intentionally excluded from this source package.

## Start

### Backend

```bash
cd server
npm ci
copy .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Frontend

```bash
cd client
npm ci
copy .env.example .env
npm run dev
```

Default development URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- API: `http://localhost:4000/api/v1`

Set the PostgreSQL and Redis values in `server/.env` to match your local environment.

## Production build

```bash
cd server
npm ci
npm run prisma:generate
npm run build
npm start
```

```bash
cd client
npm ci
npm run build
npm run preview
```

## Feature completion pass — August 14, 2026

Implemented end-to-end functionality for:

- Realtime notifications for new messages, group additions, guest joins, and community announcements, persisted in PostgreSQL and pushed through Socket.IO.
- Message delivery/read receipts with single tick for sent, double tick for delivered, and green double tick for seen/read.
- Image, document, video, audio attachments and browser-recorded voice notes.
- Authenticated media access for message attachments, with room-member authorization.
- Group member management from contacts; server enforces that added users have an active FULL paid subscription and only the group owner can add members.
- Public group invite links that automatically create temporary guest accounts.
- Guest accounts are now server-enforced read-only and cannot send, edit, or delete messages in the invited group.
- Guest invite limits respect the owner's subscription guest/member limits.
- Community announcement notifications and owner-only group attachment management.

Validation: TypeScript/TSX parser check passed for all 189 source files. A full package build was not completed in this environment because dependency installation stalled; no production-build success is claimed.


## Deployment / migration repair

The package includes a repair migration for the historical `20260813204455_deploy` schema drift. It preserves data and normalizes the social/guest tables to the snake_case columns used by the raw SQL services.

For a normal fresh deployment:

```bash
npm ci
# postinstall regenerates Prisma automatically; this explicit command is safe too
npm run db:generate
npm run db:deploy
```

For an existing database that has the old deploy migration marked incomplete or has the pre-deploy snake_case schema, do not run the historical migration blindly. First execute the idempotent SQL from `prisma/migrations/20260815000100_repair_deploy_schema/migration.sql`, then resolve the historical migration as applied and run `npm run db:deploy`.

The message history loader no longer queries the nonexistent `message_id` column; the earlier `message_user_states` table uses the quoted physical columns `messageId`, `deliveredAt`, and `readAt`.

## Final guest-link and billing update

Public group invites now work without requiring the seed script to have been run: the join endpoint repairs/creates the `guest` role on demand, creates a temporary guest session, adds the guest to the target room, and returns a ready-to-use access/refresh session. Guest RBAC is read-only; message send/edit/delete permissions are removed by migration.

Payment management is available in Admin Console. Administrators can add/edit payment methods, configure a UPI ID, and make one method the default. Plans & Billing automatically selects the active default UPI method and displays a UPI QR for the selected plan amount when a UPI ID is configured.

Deployment sequence:

```bash
cd server
npm ci
npm run db:generate
npm run db:deploy
npm run prisma:seed
```
