# ChavrutaAnytime

Connect Jewish learners for Torah study partnerships and group sessions — anytime, anywhere in the world.

---

## What it does

ChavrutaAnytime matches learners with **chavruta** partners (1-on-1 Torah study) and **chabura** groups based on subjects, availability, language, and learning level. The product succeeds when a user signs up and is actively learning with a real chavruta within 24 hours.

**Core features:**
- Intelligent match scoring based on subject compatibility, shared availability, language, and gender preference
- Recurring session scheduling with iCalendar RRULE support
- Embedded video via Jitsi Meet (no account required)
- Group chabura management with member roles
- 1-on-1 and group messaging
- Google OAuth and email passcode authentication
- Weekly match digest and session reminder notifications

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, RSC) |
| Language | TypeScript 5 (strict) |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth | Auth.js v5 (Google OAuth, email passcode) |
| Styling | Tailwind CSS 4 + shadcn/ui + Radix UI |
| Forms | react-hook-form + Zod |
| Date/Time | Luxon (always use Luxon, never raw `Date`) |
| File Upload | UploadThing |
| Email | Resend + React Email |
| Data Fetching | TanStack Query |
| Animation | Framer Motion |
| Analytics | PostHog |
| Error Tracking | Sentry |
| Testing | Vitest + Playwright |
| Hosting | Vercel |

---

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL pooled connection string |
| `DIRECT_URL` | Neon direct (non-pooled) connection string |
| `NEXTAUTH_URL` | Auth callback URL (`http://localhost:3000` locally) |
| `NEXTAUTH_SECRET` | JWT secret — generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `RESEND_API_KEY` | Resend email API key |
| `RESEND_FROM` | Sender address (e.g. `hello@chavrutaanytime.com`) |
| `UPLOADTHING_TOKEN` | UploadThing token for file storage |
| `CRON_SECRET` | Secret header for Vercel cron endpoints |
| `SENTRY_DSN` | Sentry DSN for error tracking |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key (exposed to client) |

### 3. Set up the database

```bash
pnpm db:push      # Push schema to database
pnpm db:seed      # Seed subjects and initial data (optional)
```

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
src/
  app/
    (app)/           # Authenticated routes
    (auth)/          # Sign-in, verify
    api/             # Route handlers (auth, cron, upload, poll)
  components/        # React components, organized by feature
  db/
    schema/          # Drizzle table definitions
    migrations/      # Generated SQL migrations
  lib/               # Shared utilities (matching, availability, auth)
  server/            # Server Actions (all data mutations)
  styles/            # Global CSS
```

### Key routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/sign-in` | Authentication |
| `/dashboard` | Home — upcoming sessions, suggested matches |
| `/find` | Browse and filter chavruta matches |
| `/connections` | Pending and accepted connections |
| `/sessions/new` | Create a learning session |
| `/chaburas` | Browse group study chaburas |
| `/messages` | Messaging inbox |
| `/onboarding` | Multi-step profile setup (required before dashboard) |

---

## Database

Schema is managed with Drizzle ORM. Key tables:

- `users` — profiles, NextAuth-compatible
- `user_subjects` — subject preferences with learning levels
- `connections` — chavruta partnerships
- `learning_sessions` / `session_occurrences` — recurring sessions via RRULE
- `chaburas` / `chabura_members` — group study with roles
- `conversations` / `messages` — messaging
- `notifications` — JSONB notification payloads

```bash
pnpm db:generate  # Generate migration from schema changes
pnpm db:push      # Apply schema to database
pnpm db:studio    # Open Drizzle Studio
```

---

## Cron jobs

Managed via `vercel.json` and secured with `CRON_SECRET`:

| Schedule | Endpoint | Purpose |
|---|---|---|
| Every 5 min | `/api/cron/session-reminders` | Notify users 10 min before sessions |
| Daily 3am UTC | `/api/cron/topup-occurrences` | Generate upcoming RRULE occurrences |
| Sundays 6pm UTC | `/api/cron/weekly-match-digest` | Send weekly match suggestions |

---

## Development

Node version is pinned in `.nvmrc`. Package manager is **pnpm** (see `pnpm-lock.yaml`) — don't use `npm`/`yarn`.

```bash
pnpm lint        # ESLint
pnpm typecheck   # next typegen + tsc --noEmit
pnpm test        # Vitest
```

These three run in CI on every PR (`.github/workflows/ci.yml`) and in a local pre-commit hook (Husky). Design decisions live in [`chavruta-anytime-web-app-design-guidelines.md`](./chavruta-anytime-web-app-design-guidelines.md); `buildplan.md` is the original historical spec and defers to it on brand/visual questions.

---

## Important notes

> **This is Next.js 16.** APIs, conventions, and file structure may differ from older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.

- All data mutations use **Server Actions** — no REST API for mutations
- Always use **Luxon** for date/time — never raw `Date` objects
- Availability is stored as a **bitmap** (bytea) encoding weekly time slots
- Matching scores pairs 0–100 across subjects, availability, languages, and gender preference
