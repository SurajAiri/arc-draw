# Local Setup

This sandbox has no network access, so dependencies were not installed and
migrations were not run against a live database. Do these steps on your own
machine.

## 1. Install dependencies

```bash
npm install
```

## 2. Start Postgres + MinIO

```bash
docker compose up -d
```

This starts Postgres on `5432`, MinIO on `9000` (S3 API) and `9001` (web
console at http://localhost:9001, login `minio` / `minio123`), and creates
the `diagrams` bucket automatically.

## 3. Environment variables

`.env` is already created (copied from `.env.example`) with a generated
`JWT_SECRET` and values matching `docker-compose.yml`. Nothing to change for
local dev. **If you ever deploy this beyond your own machine, regenerate
`JWT_SECRET`** — the one committed here is fine for local use only.

## 4. Run the database migration

`drizzle/0000_init.sql` is a hand-written migration matching
`lib/db/schema.ts` — I wrote it by hand since drizzle-kit couldn't run here
(no network to install it). Regenerate it properly instead of trusting it
blindly:

```bash
npx drizzle-kit generate
```

This will produce its own migration (and the `meta/` snapshot/journal files
drizzle-kit needs to track state) — compare it against `0000_init.sql`, then
delete the hand-written one once you've verified they match. Apply it:

```bash
npx drizzle-kit migrate
```

(Or `npx drizzle-kit push` for a quick local sync without a persisted
migration file, if you'd rather iterate on the schema before locking it in.)

## 5. Run the app

```bash
npm run dev
```

Visit http://localhost:3000 — you'll land on `/login` (redirected by
`proxy.ts` since there's no session yet). Register an account, then you're
in.

## Known gaps (see PRD §11 — accepted, not blockers)

- No password reset — a forgotten password needs manual DB intervention
  (`UPDATE users SET password_hash = ...` with a freshly argon2id-hashed
  value).
- No rate limiting or CSRF protection — fine for local/self-hosted single-user
  use, not for public exposure.
- Google OAuth is schema-ready (`oauth_accounts` table) but not wired up.
