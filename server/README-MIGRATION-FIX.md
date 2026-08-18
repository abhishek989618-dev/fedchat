# FedChat migration recovery

Run commands from `D:\fedchat\server` (do not `cd server` if you are already there).

1. Ensure `DATABASE_URL` is present in `server/.env`.
2. `npm ci`
3. `npm run db:generate`
4. `npm run db:deploy`
5. `npm run prisma:seed`

The deploy command now repairs both the legacy `20260813204455_deploy` failure and a previously-failed `20260815000100_repair_deploy_schema` attempt. The repair migration is schema-aware and creates missing `updated_at` columns before applying defaults/backfills.

If a command says `DATABASE_URL is required`, fix `server/.env` first; do not run Prisma against an unknown database.
