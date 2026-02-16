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
- `POST /api/functions/:functionName` (placeholder, auth required)
