# ⚽ Prode — FIFA World Cup 2026 Prediction Pool

A mobile-first web app for a private group of friends to predict the **exact
scoreline of all 104 matches** of the FIFA World Cup 2026. Predictions lock at
kickoff, the admin enters real results, points are awarded automatically, and a
live leaderboard ranks the group.

Built with **Next.js (App Router) · TypeScript · PostgreSQL (Drizzle ORM) ·
Tailwind + shadcn-style UI · Zod**. Server Actions for all mutations, fully
server-side validated, no secrets on the client.

---

## Table of contents

- [Features](#features)
- [Decisions baked in](#decisions-baked-in)
- [Quick start (local)](#quick-start-local)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Deploy to Render (public access)](#deploy-to-render-public-access)
- [How it works](#how-it-works)
- [Data accuracy ⚠️](#data-accuracy-️)
- [Project structure](#project-structure)
- [Security notes](#security-notes)

---

## Features

- **Sign in with just a name** — no passwords. The browser remembers you
  (localStorage) and auto-signs-in on return; the session is an httpOnly,
  HMAC-signed cookie.
- **Predict every match** with mobile-friendly score steppers, **optimistic
  save**, live kickoff **countdown**, and a clear **locked** state after kickoff.
- **Match detail** — after lock, the full table of everyone's predictions vs. the
  real result, points earned, exact hits highlighted, your row called out.
- **Live leaderboard** — total points, exact hits, correct outcomes, ranked with
  tiebreakers, auto-refreshing.
- **My predictions** — full history with points and a quick stats summary.
- **Admin console** — enter/edit results (auto-recompute), toggle live, edit
  scoring config, and assign teams to knockout matches as the bracket resolves.
- Tasteful motion, a **confetti burst on an exact-score hit**, and explicit
  loading / empty / error states throughout.

## Decisions baked in

These were the open questions in the spec — here's what's implemented (all easy
to change):

| Topic | Choice | Where to change |
|---|---|---|
| **Scoring** | Exact = **3**, correct outcome = **1**, wrong = **0** | Editable live in **Admin → Scoring** (stored in the `settings` table) |
| **Bet privacy** | **Fully open** — predictions visible to everyone, always | `settings.predictions_hidden_until_kickoff` flag (UI already gates the detail table on lock if you flip it) |
| **Auth** | **Name only**, no PIN. **`nacho` is a built-in admin** | `BUILTIN_ADMIN` in `src/lib/auth.ts`; extend via `ADMIN_NAMES` |
| **Fixtures** | **Official-aligned 104-match schedule** (openfootball), in Argentina time | `seed/worldcup.2026.json` → `npm run db:fixtures` → `seed/fixtures.json` + `seed/teams.json` |
| **Language** | **Spanish (es-AR)**, kickoffs shown in Argentina time for everyone | UI strings inline; `src/lib/format.ts` sets locale + timezone |

## Quick start (local)

Requires **Node 22+**, **npm**, and **Docker** (for Postgres).

```bash
# 1. Install deps
npm install

# 2. Configure env
cp .env.example .env
# generate a session secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# paste it into SESSION_SECRET, and set ADMIN_NAMES to your display name

# 3. Start Postgres
docker compose up -d db

# 4. Create the schema + seed teams and the full 104-match schedule
npm run db:migrate
npm run db:seed

# 5. Run the app
npm run dev
```

Open <http://localhost:3000>, sign in with the name you put in `ADMIN_NAMES`,
and you'll have admin access.

**Run the whole stack in Docker instead** (app + db):

```bash
docker compose up --build
```

The app container migrates + seeds on boot, then serves on
<http://localhost:3000>.

## Environment variables

See [`.env.example`](.env.example). Summary:

| Var | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string |
| `SESSION_SECRET` | ✅ | Long random string used to sign session cookies |
| `ADMIN_NAMES` | ✅ | Comma-separated display names granted admin (case-insensitive) |
| `NEXT_PUBLIC_APP_URL` | – | Public base URL (metadata) |
| `DATABASE_SSL` | – | Set to `require` for external managed Postgres (Neon/Supabase). Leave unset for local Docker and Render's internal connection |

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run db:generate` | Generate a Drizzle SQL migration from the schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:fixtures` | Regenerate `seed/fixtures.json` (the 104-match schedule) |
| `npm run db:seed` | Idempotent seed (teams, matches, default settings) |
| `npm run db:seed -- --reset` | Wipe predictions/matches/teams, then reseed |
| `npm run lint` | ESLint |

Re-seeding is **safe**: it never overwrites entered scores, match status, or the
scoring settings — so a redeploy won't clobber an in-progress tournament.

## Deploy to Render + Supabase (public access)

The database is **Supabase** (free tier persists data — no 30-day deletion like
Render's free Postgres), and the web service runs on **Render** via the
[`render.yaml`](render.yaml) Blueprint.

**Database (Supabase):**
1. Create a Supabase project.
2. **Project → Connect → Session pooler** and copy the connection string
   (host `…pooler.supabase.com`, port `5432`). Use the *pooler*, not the direct
   host — Render can't reach Supabase's IPv6-only direct connection, and the
   pooler also works for migrations.

**Web service (Render):**
1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, point it at your repo (`render.yaml`).
3. Set the `sync: false` env vars when prompted:
   - `DATABASE_URL` — the Supabase **Session pooler** string (with your real DB
     password; SSL auto-enables for supabase hosts).
   - `ADMIN_NAMES` — extra admins (optional; `nacho` is a built-in admin).
   - `NEXT_PUBLIC_APP_URL` — your `https://<service>.onrender.com` URL.
   - `SESSION_SECRET` is auto-generated.
4. Deploy. Render's **free tier doesn't support `preDeployCommand`**, so
   migrations + the idempotent seed run at the start of the `startCommand`
   (`npm run db:migrate && npm run db:seed && npm run start`) — safe to repeat on
   every boot. Health check: `/api/health`.

> Notes
> - **Schema isolation:** all app tables live in a dedicated **`prode`** Postgres
>   schema (`pgSchema("prode")`), so prode can safely share a Supabase project
>   with other tables in `public` without collisions.
> - `src/db/connection.ts` auto-enables SSL for supabase/neon hosts and uses
>   `prepare:false` for the Supabase pooler.
> - `NPM_CONFIG_PRODUCTION=false` keeps build/migrate/seed tooling (`tsx`,
>   `drizzle-kit`) available on Render.
> - Free Render web instances sleep when idle (slow first request); the Supabase
>   project pauses only after ~7 days idle and is one click to restore.

## How it works

- **Auth** (`src/lib/auth.ts`): signing in upserts a user by (case-insensitive)
  name and sets `prode_session` = `userId.HMAC(userId)` as an httpOnly cookie.
  Admin is granted to the built-in `nacho` and anyone in `ADMIN_NAMES`.
- **Predictions** (`src/app/actions/predictions.ts`): validated with Zod and
  rejected server-side once `kickoff_at` has passed — the lock can't be bypassed
  by the client.
- **Scoring** (`src/lib/scoring.ts`, `src/lib/recompute.ts`): when the admin
  finalizes a result, points for every prediction on that match are recomputed.
  Changing the scoring config recomputes **all** finished matches.
- **Leaderboard** (`src/lib/queries.ts`): a single aggregate SQL query computes
  total points, exact hits, and correct outcomes, ordered by the tiebreakers.
- **Live updates**: server components + light client polling (`AutoRefresh`,
  refresh on focus) keep the leaderboard and locked views fresh; the countdown
  ticks client-side.

## Fixture data

The schedule comes from the public-domain **openfootball** dataset
([openfootball/worldcup.json](https://github.com/openfootball/worldcup.json),
committed at `seed/worldcup.2026.json`): the real groups, FIFA match numbers
1–104, venues, and kickoff times. `scripts/generate-fixtures.ts` transforms it
into `seed/teams.json` + `seed/fixtures.json`.

- Kickoff times are stored as absolute instants (date + local time + venue UTC
  offset) and **displayed in Argentina time** (`America/Argentina/Buenos_Aires`)
  for every viewer.
- Knockout matches start with Spanish slot labels (“Ganador Grupo A”,
  “3º (A/B/C/D/F)”, “Ganador del Partido 74”…) and `null` teams; the admin
  assigns the real teams from the Admin console once the bracket resolves.
- To refresh from upstream: re-download `seed/worldcup.2026.json`, then
  `npm run db:fixtures && npm run db:seed`. A few playoff slots in the source may
  be projections; the admin can correct any team from the console.

## Project structure

```
src/
  app/
    (app)/              # authed area (shares Header + bottom nav)
      matches/          # match list + [id] detail
      leaderboard/
      my-predictions/
      admin/
    actions/            # Server Actions (auth, predictions, admin)
    signin/             # name-only sign-in
    api/health/         # health check for Render
  components/           # UI primitives + match/admin/nav components
  db/                   # Drizzle schema, client, migrate runner
  lib/                  # auth, scoring, recompute, queries, validation, format
scripts/                # generate-fixtures (transform), seed
seed/                   # worldcup.2026.json (source) → teams.json + fixtures.json
drizzle/                # generated SQL migrations
```

## Security notes

- **Name-only auth is spoofable within the group** — anyone can sign in as any
  name. That's an intentional, friendly tradeoff for a private pool. The schema
  keeps `pin_hash` ready if you want to add an optional 4-digit PIN later.
- Session cookies are httpOnly + HMAC-signed and `Secure` in production.
- All mutations are Server Actions with Zod validation and server-side
  authorization (`requireUser` / `requireAdmin`); the kickoff lock is enforced on
  the server.
- `npm audit` may report advisories in transitive build-time dependencies; the
  critical Next.js advisory is resolved by pinning a patched 15.5.x.

---

Made for friends, for the love of the game. 🏆
