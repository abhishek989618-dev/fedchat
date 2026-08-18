# FedChat Stability & UI Fixes

This build addresses the login lockout and the first-run chat/frontend problems found in the previous package.

## Authentication fixes

- Authentication rate limiting is applied only to `POST /auth/login` and `POST /auth/register`.
- Token refresh, logout and `/auth/me` are no longer counted as login attempts.
- Rate limiting uses a versioned Redis key prefix, so stale counters from the previous build do not block testing.
- Successful authentication attempts do not consume the failure budget.
- The login bucket is keyed by IP + email.
- The API and auth limiters use separate Redis namespaces.

If an old server is still running, stop it and restart the updated server. If you want to remove old rate-limit keys manually from Redis, delete keys beginning with `fedchat:rl:`.

## Seeded local accounts

After `npm run prisma:seed`:

- Platform admin: `admin@fedchat.local` / `Admin@12345`
- Test user: `test@fedchat.local` / `Test@12345`

The seed also creates a private `Test Conversation` and adds both accounts as members. This gives the test user an actual database-backed conversation for verifying Socket.IO messaging.

## Start backend

```bat
cd server
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Start frontend

```bat
cd client
npm install
npm run dev
```

Default frontend API: `http://localhost:4000/api/v1`
Default Socket.IO server: `http://localhost:4000`

Set `client/.env` if your backend is running elsewhere:

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
```

## UI fixes

- SVG icons now have explicit 18px sizing and cannot expand to browser default SVG dimensions.
- Sidebar, toolbar, chat list, message bubbles and controls use a consistent compact scale.
- Responsive mobile navigation has a real overlay and drawer.
- Admin Console is visible only to `platform_admin` users.
- Auth screen includes local Test User and Platform Admin quick-login buttons.
- Chat UI uses one Socket.IO connection instead of creating duplicate sockets in the chat window.
- Optimistic duplicate messages were removed; the server `message:new` event is the single source of truth.
- Incoming messages are automatically acknowledged with delivered/read socket events.
- Typing indicators use the existing room socket.
