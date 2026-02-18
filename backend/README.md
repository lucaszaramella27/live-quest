# LiveQuest Backend (PostgreSQL)

## Setup

1. Copy `.env.example` to `.env` inside `backend/`.
   Configure at least `DATABASE_URL`, `JWT_SECRET`, and `GOOGLE_CLIENT_ID`.
2. Create a PostgreSQL database.
3. Run `backend/db/schema.sql` in your database.
4. Install dependencies:

```bash
npm install
```

5. Start the backend:

```bash
npm run dev
```

The API runs by default on `http://localhost:3001`.

## Current API

- `GET /healthz`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `POST /api/db/query` (generic query endpoint, auth required)
- `POST /api/functions/createStripeCheckoutSession` (auth required)
- `POST /api/functions/createStripePortalSession` (auth required)
- `POST /api/functions/setPremiumStatus` (admin only)
- `POST /api/functions/ensureUserProgress` (auth required)
- `POST /api/functions/setActiveTitle` (auth required)
- `POST /api/functions/purchaseShopItem` (auth required)
- `POST /api/functions/applyDocumentReward` (auth required)
- `POST /api/functions/getWeeklyChallenges` (auth required)
- `POST /api/functions/claimWeeklyChallengeReward` (auth required)
- `POST /api/functions/setUserXP` (admin only)
- `POST /api/functions/setUserCoins` (admin only)
- `POST /api/functions/setUserLevel` (admin only)
- `POST /api/functions/resetUserProgress` (admin only)
- `POST /api/functions/twitchConnect` (auth required)
- `POST /api/functions/twitchDisconnect` (auth required)
- `POST /api/functions/twitchUpdateSettings` (auth required)
- `POST /api/functions/twitchCheckLiveStatusAndReward` (auth required)

## Billing function env vars

- `APP_BASE_URL` (frontend base URL, default fallback: `http://localhost:5173`)
- `BILLING_CHECKOUT_URL` (optional generic checkout URL)
- `BILLING_CHECKOUT_URL_MONTHLY` (optional monthly override)
- `BILLING_CHECKOUT_URL_YEARLY` (optional yearly override)
- `BILLING_PORTAL_URL` (optional portal URL)

When billing URLs are not configured and `NODE_ENV` is not `production`, checkout uses a dev fallback that redirects to `/plans?checkout=success`.

## Twitch env vars

- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`
- `TWITCH_REDIRECT_URI` (optional override for callback URL)
