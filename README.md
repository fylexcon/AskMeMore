# Ask Me More

Ask Me More is a mobile-first couples connection app built as a monorepo with:

- `apps/mobile`: Expo React Native client
- `apps/api`: Fastify API
- `packages/contracts`: shared schemas and types
- `packages/content`: bundled deck content and quotes

## MVP scope

- Email OTP auth
- Relationship pairing with invite codes
- Local-first question history and progress
- Premium unlock via redeemable access code
- AI-generated premium questions through a protected API
- Aggregate-only sync to preserve privacy

## Commands

```bash
npm install
npm run dev:api
npm run dev:mobile
npm run test
```

## Environment

Create these files before running locally:

- `apps/api/.env`
- `apps/mobile/.env`

Reference examples are included in each app directory.
