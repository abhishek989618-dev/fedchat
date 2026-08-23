# FedChat update — 21 Aug 2026

Implemented:
- Login accepts email or phone; country-code picker/typing defaults to +91.
- Registration phone is stored with country code.
- Username/password examples and placeholders added.
- Remember-me persistence uses localStorage when enabled and sessionStorage otherwise; refresh preserves that choice.
- Admin site settings expanded for logo, favicon, platform language and alert language.
- Platform settings are applied globally for title, favicon, language and theme CSS variables.
- Added per-user theme (light/dark) and language preferences stored in PostgreSQL.
- Added migration `20260821150000_user_preferences`.
- Media attachments now open a preview with Send/Close before upload; sending shows a loader.
- Text messages get an optimistic local message so “Start a new conversation” disappears immediately after send.
- Mobile sidebar is restored as a left drawer instead of a bottom menu; mobile header/conversation header heights reduced.

Deployment:
1. Upload/extract this project.
2. In `server`, run the existing migration command used by the deployment, or apply the new SQL migration:
   `server/prisma/migrations/20260821150000_user_preferences/migration.sql`
3. Regenerate Prisma client if your deployment workflow does so.
4. Build the client with `npm ci && npm run build`.
5. Restart/reload the server and web service.

Note: the language framework now supports English/Hindi selection and persists the preference. Existing UI copy is still largely English; translating every existing screen string requires a broader i18n pass.
