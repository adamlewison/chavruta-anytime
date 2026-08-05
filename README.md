# ChavrutaAnytime

Connect Jewish learners for Torah study partnerships and group sessions — anytime, anywhere in the world.

---

## What it does

ChavrutaAnytime matches learners with **chavruta** partners (1-on-1 Torah study) and **chabura** groups based on subjects, availability, language, and learning level. The product succeeds when a user signs up and is actively learning with a real chavruta within 24 hours.

**Core features:**
- Intelligent match scoring based on subject compatibility, shared availability, language, and gender preference
- Recurring session scheduling with iCalendar RRULE support
- Embedded video and voice calls via LiveKit
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
| Date/Time | Luxon (always use Luxon, never raw `Date`) |
| Video | LiveKit (`livekit-client` + `livekit-server-sdk`) |
| File Upload | Vercel Blob (`@vercel/blob`) |
| Email | Resend |
| Data Fetching | TanStack Query |
| Animation | Framer Motion |
| Validation | Zod (schemas in `src/domain/schemas/`) |
| Testing | Vitest |
| Hosting | Vercel |

> **Declared but not yet wired:** `@sentry/nextjs`, `posthog-js`, `react-hook-form`,
> `@hookform/resolvers`, and `@playwright/test` are in `package.json` but have no
> integration code. Don't assume error tracking, analytics, or E2E coverage exist.

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
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | JWT secret — generate with `openssl rand -base64 32`. Read implicitly by Auth.js |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `RESEND_API_KEY` | Resend email API key |
| `RESEND_FROM` | Sender address (e.g. `hello@chavrutaanytime.com`) |
| `LIVEKIT_API_KEY` | LiveKit server API key |
| `LIVEKIT_API_SECRET` | LiveKit server API secret |
| `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit websocket URL (exposed to client) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin, used in email links |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token. Auto-injected on Vercel; needed locally |
| `CRON_SECRET` | Bearer token for the Vercel cron endpoints |

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

See **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** — it is the single source of truth for
the directory tree, naming rules, layer boundaries, and where any new file belongs.
Run `pnpm check:arch` to verify changes against it.

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
