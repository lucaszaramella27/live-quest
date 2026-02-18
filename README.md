# LiveQuest

Full-stack app (Vite + React) with a Node/Express backend and PostgreSQL.

## Requirements

- Node.js 18+
- PostgreSQL 14+

## Setup (Local)

1. Create the frontend env file:

```bash
cp .env.example .env
```

2. Create the backend env file:

```bash
cp backend/.env.example backend/.env
```

3. Create a PostgreSQL database (example: `livequest`) and run the schema:

- Run `backend/db/schema.sql` in your database (DBeaver, psql, etc).

4. Install deps:

```bash
npm install
npm --prefix backend install
```

5. Start backend + frontend:

```bash
npm run backend:dev
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001/healthz`

## Google Login (OAuth)

1. Create a project in Google Cloud Console.
2. Configure OAuth consent screen as "External" (for personal Gmail testing).
3. Create OAuth Client ID (Web application).
4. Add:

- Authorized JavaScript origins: `http://localhost:5173`

5. Put the same Client ID in:

- `VITE_GOOGLE_CLIENT_ID` (frontend `.env`)
- `GOOGLE_CLIENT_ID` (backend `.env`)

## Notes

- `.env` files are ignored by git. Do not commit secrets.
- The backend enforces per-user access control on DB reads/writes via `/api/db/query`.
- Billing actions use `/api/functions/createStripeCheckoutSession` and `/api/functions/createStripePortalSession`.

