# Social Media Manager

Internal tool for planning, assigning, and tracking Instagram Reels across multiple
social media profiles. Admins plan content and see performance; workers see only
their own assigned tasks and mark them as published.

Built with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, Prisma, and
Auth.js (NextAuth v5, credentials + JWT sessions). Fully server-rendered with Server
Actions for all mutations — no data lives only in the browser.

## Features

- Role-based access (ADMIN / WORKER) enforced both in the proxy (route guard) and in
  every Server Action (`requireAdmin()` / `requireUser()` in `src/lib/session.ts`).
- Admin dashboard with KPIs, today's/overdue tasks, and a profile performance chart.
- Content table with search, filter (profile/status), sort, and pagination.
- Reel creation form, detail/edit view, publish flow, manual analytics entry.
- Calendar with month/week/day views, colored by profile, create-from-calendar.
- Monthly analytics with per-profile breakdown, charts, and averages.
- Profile management (create/edit/deactivate) and per-profile performance pages.
- Worker "Moje úlohy" view: today / overdue / upcoming, with a one-tap publish flow.
- In-app notification center (per-user, unread badge) + optional Telegram push
  notifications (new task, overdue, published) — Telegram is fully optional.
- Automatic overdue detection (checked on page load and via a Vercel Cron endpoint).

## Tech stack

- Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS 4
- PostgreSQL + Prisma ORM (`prisma/schema.prisma`)
- Auth.js v5 (Credentials provider, bcrypt password hashing, JWT sessions)
- Recharts for charts, Sonner for toasts, Zod for input validation

## Project structure

```
prisma/schema.prisma       Database schema (User, Profile, ContentTask, Analytics, Notification, AppSettings)
prisma/seed.ts              Seed script (2 admins/workers, 5 profiles, sample tasks)
src/app/(app)/...           Authenticated app shell: dashboard, content, calendar, analytics, profiles, settings, my-tasks
src/app/login                Login page
src/app/api/auth/...          Auth.js route handler
src/app/api/cron/sync-overdue Vercel Cron endpoint that flips overdue tasks + notifies
src/actions/...              Server Actions (all mutations; each starts with an auth check)
src/lib/...                  Prisma client, auth config, session helpers, queries, Telegram, notifications
src/components/...           UI primitives + feature components
src/proxy.ts                 Route guard (Next.js 16 renamed "middleware" to "proxy")
```

## Running locally

### 1. Prerequisites

- Node.js 20.9+
- A PostgreSQL database (local Postgres, Docker, Supabase, Neon, etc.)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/social_media_manager?schema=public"
AUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
# Optional, can be left empty for local dev:
TELEGRAM_BOT_TOKEN=""
TELEGRAM_WORKER_CHAT_ID=""
CRON_SECRET=""
```

### 4. Run database migrations

```bash
npm run db:migrate
```

### 5. Seed the database with test data

```bash
npm run db:seed
```

This creates:

- **Admin** — `admin@smm.local` / `Admin123!`
- **Worker** — `worker@smm.local` / `Worker123!`
- **Worker 2** — `worker2@smm.local` / `Worker123!`
- 5 profiles (Mediktest, Mediktest CZ, Chlapec na medicíne, Dievča na medicíne, Studigenius)
- ~20 sample Reel tasks across all statuses (published with analytics, overdue, planned, cancelled)

> These credentials are for local development only. Change/remove them before any
> real deployment, or create fresh users via Settings → Users once deployed.

### 6. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000 and log in with one of the seeded accounts.

Other useful scripts:

```bash
npm run db:studio   # Prisma Studio (browse/edit data)
npm run build        # production build (also runs prisma generate)
npm run lint          # ESLint
```

## Deploying to Vercel

1. Push this repository to GitHub (or your Git provider of choice).
2. In Vercel, "Add New Project" → import the repo. The project root must contain
   `package.json` (it does) — no special root directory configuration needed.
3. Provision a PostgreSQL database (Vercel Postgres, Neon, Supabase, etc.) and copy
   its connection string.
4. In Vercel → Project → Settings → Environment Variables, add:
   - `DATABASE_URL` — your production Postgres connection string
   - `AUTH_SECRET` — a random secret (`openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` — your Vercel URL, e.g. `https://your-app.vercel.app`
   - `TELEGRAM_BOT_TOKEN` / `TELEGRAM_WORKER_CHAT_ID` — optional, can configure later
     from the in-app Settings page instead
   - `CRON_SECRET` — optional, protects the cron endpoint from being called by anyone
5. Deploy. Vercel runs `npm install` (which triggers `prisma generate` via
   `postinstall`) and then `npm run build`.
6. Run the initial migration against the production database once, from your
   machine (or a one-off Vercel deploy hook):
   ```bash
   DATABASE_URL="<production-url>" npx prisma migrate deploy
   ```
7. Optionally seed the production database the same way (only if you want the demo
   data there — normally you'd create real users/profiles via the app instead):
   ```bash
   DATABASE_URL="<production-url>" npm run db:seed
   ```
8. `vercel.json` already schedules `/api/cron/sync-overdue` every 15 minutes via
   Vercel Cron so overdue tasks and Telegram alerts fire even when nobody has the
   app open.

No custom domain is required — the app works fine on the default
`your-app.vercel.app` URL.

## Notifications (Telegram)

Telegram is optional and the app works fully without it. To enable it:

1. Create a bot with [@BotFather](https://t.me/BotFather) and copy the bot token.
2. As an admin, go to **Settings** and paste the token (or set `TELEGRAM_BOT_TOKEN`
   as an env var — the Settings value takes precedence).
3. Each user (admin or worker) can set their own Telegram Chat ID from **Profil**
   (worker) — this is where their personal notifications are sent.

If no token/chat ID is configured, Telegram sends are silently skipped; nothing
in the app depends on them.

## Security notes

- Passwords are hashed with bcrypt; nothing sensitive is stored in plaintext.
- All mutations run through Server Actions that re-check the session and role
  server-side (`requireAdmin`/`requireUser`) — the route guard (`src/proxy.ts`) is a
  UX convenience, not the security boundary.
- Workers can only read/act on their own assigned tasks; this is enforced with a
  server-side ownership check on every task detail load and mutation, not just by
  hiding links in the UI.
- No secrets are ever sent to the client; environment variables are only read in
  Server Components, Server Actions, and Route Handlers.

## Architecture notes for future extensions

The schema and code are structured so the following can be added without a rewrite:

- **Instagram Graph API** — `ContentTask.instagramUrl` and the `Analytics` model
  already exist; a sync job could populate `Analytics` automatically instead of
  manual entry.
- **File uploads** — `ContentTask.attachmentUrl` is a plain URL today; swapping in
  Vercel Blob (or S3) only requires changing the upload step in the task form.
- **WhatsApp notifications** — `src/lib/notify.ts` centralizes all notification
  triggers; adding a channel means adding one more sender alongside
  `src/lib/telegram.ts`.
- **CSV/PDF export, recurring templates, approval workflow** — all read from the
  same `ContentTask`/`Analytics` tables via `src/lib/queries.ts`, so new
  export/report pages can reuse those queries directly.
