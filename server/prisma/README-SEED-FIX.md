# FedChat migration / seed deployment

From `server/` (do not run `cd server` again when your prompt already shows `D:\fedchat\server>`):

```bat
npm ci
npm run db:generate
npm run db:deploy
npm run prisma:seed
```

`db:deploy` now automatically detects the known failed `20260813204455_deploy` migration, runs the idempotent repair, marks only that failed migration as rolled back, and then continues with the safe migration set.

Prisma 7 command syntax is:

```bat
npx prisma migrate resolve --rolled-back 20260813204455_deploy
```

not `npx prisma resolve`.

`npm run db:resolve` is provided as an escape hatch for manual Prisma migration resolution.
