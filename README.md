# FedChat — Full-stack modular real-time chat platform

FedChat is a WhatsApp-style real-time messaging platform foundation built around **React + Vite + Node.js + Express + TypeScript + PostgreSQL + Prisma 7 + Redis + Socket.IO**.

## Included

- Modular React frontend (`client/src/modules/*`)
- Authentication + refresh sessions
- Four primary roles: `platform_admin`, `group_admin`, `user`, `guest`
- Granular permissions
- Real-time Socket.IO chat
- Message send/edit/delete/reactions
- Delivery/read receipt events backed by `MessageUserState`
- Online presence and typing events
- Rooms and paid group enforcement
- Manual subscription/payment approval flow
- Subscription plans
- Payment methods and payment requests
- Notifications
- Platform admin/user/subscriber/settings/audit foundations
- Contacts/contact requests
- Status/status views
- Communities
- Public group invite + temporary guest accounts (2-day session)
- Media upload module foundation
- Redis presence
- Rate limiting and security middleware

## Important design rule

Paid functionality is enforced by the **backend**. Hiding a button in React is not considered authorization.

A normal user can message. Group/community creation requires an active subscription with `FULL` access. Subscription activation is intentionally not performed by the normal `/subscriptions` activation flow; use the manual payment request endpoints and platform-admin approval.

## Local Windows setup

### 1. PostgreSQL

Create a PostgreSQL database and set:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/fedchat
```

### 2. Redis

Run Redis locally and set:

```env
REDIS_URL=redis://localhost:6379
```

### 3. Server environment

Create `server/.env` from `server/.env.example`.

Recommended local values:

```env
PORT=4000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/fedchat
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
PLATFORM_ADMIN_EMAIL=admin@fedchat.local
PLATFORM_ADMIN_PASSWORD=Admin@12345
```

### 4. Install dependencies

From `server`:

```bat
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

From `client`:

```bat
npm install
npm run dev
```

The frontend uses:

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
```

## Default platform admin

The seed creates a platform admin using the environment variables above.

Default local credentials when variables are not overridden:

- Email: `admin@fedchat.local`
- Password: `Admin@12345`

Change these immediately outside local development.

## Real-time event contract

Main Socket.IO events:

- `join_room`
- `message:send`
- `message:new`
- `message:edit`
- `message:updated`
- `message:delete`
- `message:deleted`
- `message:delivered`
- `message:read`
- `message:reaction`
- `message:reaction:remove`
- `typing:start`
- `typing:stop`
- `presence:check`

The React chat module subscribes to `message:new`, joins rooms, loads history and sends through Socket.IO so messages appear without a page refresh.

## Manual subscription flow

1. User opens Plans & Billing.
2. User selects a plan.
3. User makes the payment outside the application using the configured manual method.
4. User submits transaction/reference ID through `/payments/requests`.
5. Platform admin reviews the request.
6. Admin approves/rejects it.
7. Approval activates the subscription.
8. Backend subscription checks enforce paid features.

## Guest group flow

A group member can create an invite using the guest module. A public visitor can call the join endpoint with the invite token. FedChat creates a `guest` user, joins the target room, creates a 2-day guest session and returns temporary credentials/tokens.

Guest access is scoped to the joined room by the room membership model.

## Architecture

```text
React/Vite
   |
   +---- REST API ---- Express/TypeScript ---- Prisma ---- PostgreSQL
   |
   +---- Socket.IO ---------------------------+
                                               |
                                             Redis
                                               |
                                           Presence/Realtime
```

## Production notes

- Configure a real object-storage adapter before storing large media in production.
- Put the API behind HTTPS/WSS.
- Rotate JWT secrets.
- Configure a real email/SMS verification provider if required.
- Configure ClamAV only when it is actually installed; media scanning should be optional and fail closed according to deployment policy rather than crashing the API.
- Run `prisma generate` after schema changes.
- Run `npm run build` in both client and server before deployment.
