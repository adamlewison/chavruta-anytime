# ChavrutaAnytime — Build Spec & Agent Prompt

> **Historical document.** This was the original build spec used to scaffold the app. Most of it (schema, algorithms, page map, cron jobs) still reflects how the app works — but the brand/visual design in §3 below has since been superseded. For current design decisions, use [`chavruta-anytime-web-app-design-guidelines.md`](./chavruta-anytime-web-app-design-guidelines.md), which matches what's actually implemented in `src/styles/globals.css`.

> You are building **ChavrutaAnytime**, a platform that helps Jewish learners find learning partners (chavrutas) and groups (chaburas) for Torah study, schedule recurring sessions, and meet over video — anytime.
>
> This document is the complete spec. Treat every section as a requirement, not a suggestion. When something is ambiguous, choose the option that produces the most polished, mobile-first, opinionated product.

---

## 1. Product Vision

A learner in Lakewood at 11pm wants to learn Gemara with someone — anywhere in the world — _right now_ or every Tuesday at 9pm. ChavrutaAnytime makes that one tap away.

Three primitives:

1. **Chavruta** — 1-on-1 learning partnership. Matched by language, gender, subject, availability.
2. **Chabura** — group of learners studying together (e.g., "Daf Yomi NYC", "Women's Tanakh Tuesdays").
3. **Session** — a recurring scheduled learning meeting attached to a chavruta or chabura, with a video meeting link.

The product wins when a user signs up Sunday night and is mid-shiur with a real chavruta by Monday.

---

## 2. Tech Stack

> **As-built, corrected from the original spec.** Rows marked ⚠ differ from what was
> originally planned. The README table is the authoritative copy.

| Layer        | Choice                                                                              |
| ------------ | ----------------------------------------------------------------------------------- |
| Framework    | ⚠ **Next.js 16** (App Router, RSC, Server Actions) — spec said 15                   |
| Database     | **Neon** Postgres (serverless)                                                      |
| ORM          | **Drizzle ORM** + drizzle-kit migrations                                            |
| Auth         | **NextAuth v5 (Auth.js)** — Google OAuth + Email passcode (Resend)                  |
| Hosting      | **Vercel** (incl. Cron)                                                             |
| UI           | **shadcn/ui** (heavily themed — no default slate)                                   |
| Styling      | **Tailwind CSS** with custom palette                                                |
| Animations   | **framer-motion** + Tailwind transitions                                            |
| Toasts       | **sonner**                                                                          |
| Validation   | ⚠ **zod** — `react-hook-form` was specified but is unused                           |
| Dates/TZ     | **luxon** (always; never raw `Date` for TZ math)                                    |
| Recurrence   | **rrule**                                                                           |
| Live updates | **Polling** (5s) — TanStack Query + ETag/304, paused on hidden tabs (no websockets) |
| Email        | ⚠ **Resend** — `react-email` was specified but is unused                            |
| Storage      | ⚠ **Vercel Blob** (`@vercel/blob`) — spec said UploadThing                          |
| Video        | ⚠ **LiveKit** — spec said Jitsi Meet (see §10)                                      |
| Analytics    | ⚠ **PostHog** — declared, not wired                                                 |
| Errors       | ⚠ **Sentry** — declared, not wired                                                  |

⚠ Node 22 (`.nvmrc`), not 20. pnpm. TypeScript strict. ESLint. Husky pre-commit.

---

## 3. Brand & Design System

See [`chavruta-anytime-web-app-design-guidelines.md`](./chavruta-anytime-web-app-design-guidelines.md) for the current colors, typography, and component conventions — that file is the source of truth and matches `src/styles/globals.css`.

A few product-level UX rules from the original spec still apply and aren't restated there:

- **Mobile-first, non-negotiable**: every page must work at 375px wide with no horizontal scroll. Bottom tab bar on mobile: Home, Find, Chaburas, Messages, Profile. Tap targets ≥ 44px. Sheets/drawers (shadcn `Sheet`) for secondary actions on mobile, dialogs on desktop.
- **Motion**: page transitions via framer-motion (fade + 4px slide, 180ms). Connection accepted → confetti burst (`canvas-confetti`). Sonner toasts on every async action — success and error, no silent success.
- **Empty & loading states**: shadcn `Skeleton` matching the final layout, never bare spinners. Empty states are first-class: heading, supporting line, primary CTA.

---

## 4. Database Schema (Drizzle)

All tables in `src/db/schema/`. Use snake_case in DB, camelCase in TS via Drizzle. UUIDs (v7 if available, else v4) for all PKs except join tables which can be composite.

### 4.1 Auth tables (NextAuth adapter — standard)

`users`, `accounts`, `auth_sessions` (rename from `sessions` to avoid collision with our learning sessions), `verification_tokens`. Use Drizzle's official Auth.js adapter table shape, but **rename the auth `sessions` table to `auth_sessions`** in the adapter config.

### 4.2 `users` (extended)

```
id                uuid pk
email             text unique not null
emailVerified     timestamptz
name              text
bio               text                          -- 280 char soft limit, enforced client + zod
image             text                          -- profile pic URL (UploadThing)
gender            enum('male','female')         -- required for matching
country           text                          -- ISO 3166-1 alpha-2
postCode          text
languages         text[]                        -- BCP-47 codes, e.g. ['en','he','yi']
timezone          text                          -- IANA, e.g. 'America/New_York'
availability      bytea                         -- 336 bits = 42 bytes — single weekly mask
onboardedAt       timestamptz
darkMode          boolean default false
createdAt, updatedAt
```

> **Weekly availability bitmap:** one 336-bit mask per user (7 days × 48 half-hour slots, Sunday=0, slot 0 = 00:00–00:30 local). Anchored to **the user's own `timezone`**. Conversion to UTC happens at match time per §7. Matching is **fuzzy-tolerant** (§7.3): a 30-min misalignment between two users still counts as a partial match.

### 4.3 `subjects`

```
id          uuid pk
slug        text unique not null     -- e.g. 'gemara-bava-kamma'
name        text not null            -- 'Gemara Bava Kamma'
hebrewName  text                     -- 'גמרא בבא קמא'
description text
image       text
sortOrder   int default 0
createdAt
```

Seeded list (≥ 30 subjects): Chumash, Rashi, Mishnah, Gemara (per masechta — at least the most common 12), Tanakh, Halacha (Mishna Berura, Shulchan Aruch), Mussar (Mesilas Yesharim, Chovos Halevavos), Chassidus (Tanya, Likutei Moharan), Machshava, Parsha, Daf Yomi, Mishnah Yomi, Hebrew language, etc.

### 4.4 `user_subjects` (many-to-many, with proficiency)

```
userId      uuid fk
subjectId   uuid fk
level       enum('beginner','intermediate','advanced','teaching')
createdAt
pk (userId, subjectId)
```

### 4.5 `connections`

```
id          uuid pk
requesterId uuid fk users
addresseeId uuid fk users
status      enum('pending','accepted','declined','blocked')
createdAt, respondedAt
unique(requesterId, addresseeId)
check (requesterId <> addresseeId)
```

Helper view or query: `connections_accepted` returns the unordered pair where status = 'accepted'.

### 4.6 `chaburas`

```
id            uuid pk
slug          text unique
name          text
description   text
creatorId     uuid fk users
roshChaburaId uuid fk users          -- can equal creator
isPublic      boolean default true
image         text
createdAt, updatedAt
```

### 4.7 `chabura_members`

```
chaburaId   uuid fk
userId      uuid fk
role        enum('rosh','member','pending')
joinedAt
pk (chaburaId, userId)
```

### 4.8 `learning_sessions` (the chavruta/chabura recurring schedule)

```
id              uuid pk
type            enum('chavruta','chabura')
chavrutaPairId  uuid fk connections          -- if type=chavruta
chaburaId       uuid fk chaburas              -- if type=chabura
subjectId       uuid fk subjects
title           text                          -- e.g. "Chumash with Yossi"
rrule           text                          -- RFC 5545 RRULE string
dtstart         timestamptz                   -- first occurrence start, UTC
durationMin     int                           -- 30/45/60/90/120
timezone        text                          -- IANA — for display + RRULE expansion
status          enum('active','paused','cancelled')
meetUrl         text                          -- Jitsi room URL, generated on creation
createdById     uuid fk users
createdAt, updatedAt
check (type='chavruta' AND chavrutaPairId IS NOT NULL) OR (type='chabura' AND chaburaId IS NOT NULL)
```

### 4.9 `session_occurrences`

```
id                uuid pk
sessionId         uuid fk learning_sessions
startsAt          timestamptz                 -- UTC
endsAt            timestamptz                 -- UTC
status            enum('scheduled','cancelled','completed','missed')
meetUrl           text                        -- per-occurrence override; null = use parent
notes             text
createdAt
unique(sessionId, startsAt)
index on (startsAt) where status = 'scheduled'
```

### 4.10 `messages` & `conversations`

```
conversations
  id              uuid pk
  type            enum('dm','chabura')
  chaburaId       uuid fk chaburas              -- if type=chabura
  createdAt
  -- for DMs, membership lives in conversation_members

conversation_members
  conversationId uuid fk
  userId         uuid fk
  lastReadAt     timestamptz
  pk(conversationId, userId)

messages
  id             uuid pk
  conversationId uuid fk
  senderId       uuid fk users
  body           text
  createdAt
  editedAt
  index on (conversationId, createdAt desc)
```

DM conversation rule: exactly 2 members, both must be `connections.status='accepted'`. Enforce in service layer.

### 4.11 `notifications`

```
id        uuid pk
userId    uuid fk
type      enum(
            'connection_request',
            'connection_accepted',
            'chabura_invite',
            'chabura_request',
            'session_invite',
            'session_starting_soon',     -- 10 min before
            'session_starting_now',
            'session_cancelled',
            'message_received',
            'match_found'
          )
payload   jsonb            -- typed per `type`
readAt    timestamptz
createdAt
index on (userId, createdAt desc) where readAt is null
```

### 4.12 Indexes (don't skip)

- `users (timezone)`, `users (gender)` — match filters
- GIN on `users.languages`
- `session_occurrences (startsAt)` partial where scheduled — for cron + dashboard
- `messages (conversationId, createdAt desc)`
- `connections (addresseeId, status)` — pending request inbox

---

## 5. Authentication

NextAuth v5 with two providers:

1. **Google** — standard OAuth, scopes: `openid email profile`. No special scopes — Google sign-in is purely identity.
2. **Email passcode** — 6-digit numeric, 10-min TTL, sent via Resend with a react-email template branded in parchment + ember. _Not_ a magic link; the user types the 6 digits. Rate-limit: 5 sends per email per hour, 10 verify attempts per code.

Sign-in flow:

```
/sign-in
  → "Continue with Google"  → Google OAuth → /onboarding (if not onboarded) | /dashboard
  → Email input             → POST /api/auth/passcode/send → /verify
/verify
  → 6-digit input (auto-advance, paste support)
  → POST /api/auth/passcode/verify → set session → /onboarding | /dashboard
```

Passcode storage uses NextAuth `verification_tokens`; we hash the code with SHA-256 + a per-row salt before storing.

Middleware protects all routes except `/`, `/sign-in`, `/verify`, `/api/auth/*`, public chabura listing pages.

---

## 6. Onboarding

A 6-step wizard at `/onboarding`. Cannot skip; cannot use the rest of the app until complete (`users.onboardedAt is not null`). Progress persisted on each step.

1. **Identity** — name, bio (280 chars, with live count), profile pic upload (UploadThing, 2MB cap, square crop)
2. **Basics** — gender (required for matching, with explainer "Used for chavruta matching only"), country (combobox, IP-prefilled), post code (optional)
3. **Languages** — multi-select chips with flags. Default to browser languages.
4. **Timezone** — auto-detect via `Intl.DateTimeFormat().resolvedOptions().timeZone`, allow override.
5. **Subjects** — searchable grid, tap to add, choose level for each (chip displays level). Min 1.
6. **Availability** — the weekly grid (see §6.1).

After step 6, `onboardedAt = now()`, redirect to `/dashboard` with a sonner toast: _"Welcome — let's find you a chavruta."_

### 6.1 Availability Picker UI

A 7-column × 48-row (30-min) grid for the user's local week.

- Mobile: horizontal scroll-snapped per day; each day is a single column showing 24h labeled at the hour. Pinch-to-zoom disabled; rows are 28px tall.
- Two-state cell: tap to toggle on/off. Tap-and-drag to paint a range; the drag inherits the toggle state of the first cell touched (so dragging from an off cell turns cells on, and vice versa). Erase mode = drag from an on cell.
- "Quick fill" presets: _Weekday evenings (7–10pm)_, _Weekday mornings (6–9am)_, _Late-night learner (10pm–1am)_, _Shabbos out (Fri sunset–Sat night)_, _Clear all_.
- Always show a "your timezone is **America/New_York** ([change](/onboarding?step=4))" banner above the grid.
- Helper microcopy below the grid: _"Don't worry about being exact — we'll match you with people whose times are close to yours, even if they're 30 minutes off."_
- Save serializes the bitmap to a 42-byte buffer and stores in `users.availability`. Bit index = `dayOfWeek*48 + halfHourSlot` (Sunday=0, slot 0 = 00:00–00:30 local).

---

## 7. Matching Algorithm

Endpoint: `GET /api/match?limit=20` (server action `findMatches()` for RSC).

### 7.1 Hard filters (must all pass)

1. Other user has `onboardedAt is not null`
2. Same `gender`
3. At least one shared `language`
4. At least one shared `subject` (via `user_subjects`)
5. At least one shared slot — **strict OR fuzzy** — in UTC (see §7.3). I.e. either an exact 30-min overlap, or a 30-min misalignment.
6. Not already an accepted/blocked connection
7. Not the current user

### 7.2 Score (0–100)

```
score =
    35 * subjectOverlap_jaccard          // shared subjects / union
  + 25 * exactHours_normalized           // strict 30-min overlap, capped at 10h/wk → 1.0
  + 15 * nearHours_normalized            // ±30-min adjacency-only overlap, capped at 8h/wk → 1.0
  + 10 * languageOverlapJaccard
  +  8 * teachingComplement              // 1.0 if one is 'teaching' the subject the other is 'beginner', else 0
  +  4 * countrySameBonus                // 1 if same country
  +  3 * recencyBonus                    // user logged in within 7d
```

Why split exact vs near: a partner who's perfectly aligned at 9:00 should outrank a partner who's at 9:30 — but the 9:30 partner shouldn't score zero on availability. Exact overlap is worth ~3.3 pts/hour; near overlap is worth ~1.9 pts/hour. Exact and near are _additive_ (a user who shares 4h exact + 2h near gets credit for both).

Tie-break: more recent login first.

Return shape:

```ts
{
  user: PublicUserView,
  score: number,
  highlights: {
    sharedSubjects: Subject[],     // top 3
    sharedLanguages: string[],
    exactHoursPerWeek: number,     // strict overlap
    nearHoursPerWeek: number,      // ±30-min adjacency only (no double-count w/ exact)
    teachingComplement?: { mentor: 'them'|'you', subject: Subject }
  }
}
```

The card UI renders this as: _"4h/wk together · +2h close by"_ — honest about the kind of compatibility.

### 7.3 Availability overlap math (DST-correct, fuzzy-tolerant)

**Step 1: expand to UTC** — both users' bitmaps are anchored to _their own_ `timezone`. Convert each to a UTC-aligned mask for the **current week starting next Sunday 00:00 UTC**:

```
for each user u:
  for bit i in 0..335:
    localStart = sundayLocal(u.timezone) + minutes(i * 30)
    utcStart   = localStart.toUTC()                     // luxon handles DST
    utcBit     = floor( (utcStart - weekRefUtc).asMinutes / 30 )
    expandedMask[utcBit] = u.bitmap[i]
```

Each user's grid is converted using their actual zone for _that specific reference week_, so DST transitions in either zone are handled correctly. Cache the expanded mask per (user, weekRef).

**Step 2: dilate** — produce a "fuzzy" version of each mask by setting each bit and its two ±30-min neighbors. The week is treated as a **336-bit ring** (Saturday 23:30 ↔ Sunday 00:00), so the shifts are circular:

```
dilate(M) = M | rotateLeft(M, 1) | rotateRight(M, 1)
```

This means a 30-min misalignment counts as touching, but a 60-min gap doesn't.

**Step 3: compute strict and near overlap**:

```
strict     = A & B                              // both available the same half-hour
near_raw   = (dilate(A) & B) | (A & dilate(B))  // either user is one slot off from the other
near_only  = near_raw & ~strict                 // exclude bits already counted in strict

exactHours = popcount(strict)    / 2            // 30-min slots → hours
nearHours  = popcount(near_only) / 2
```

A bit is in `near_only` iff one user is available at slot _i_ and the other is available at slot _i±1_ but neither at slot _i_ itself for _both_. This is the right count: each "near miss" costs one slot of fuzzy budget, no double-counting.

**Step 4: feed into the score** — `exactHours_normalized = min(exactHours, 10) / 10`, same for near at /8.

Implementation: `availability.ts` exposes:

```ts
expandToUtcWeek(bitmap: Uint8Array, tz: string, weekStartUtc: DateTime): Uint8Array
dilate(mask: Uint8Array): Uint8Array         // 1-slot circular dilation over 336 bits
overlap(a: Uint8Array, b: Uint8Array): {
  exactHours: number;
  nearHours: number;
  strictMask: Uint8Array;     // for the heatmap on /find/[userId]
  nearMask: Uint8Array;
}
popcountHours(mask: Uint8Array): number
```

Bit-twiddling note: store the 336-bit mask as `Uint8Array(42)`. For circular shifts, treat the buffer as a single 336-bit integer; shift bytes with carry across the array, and wrap the bit that falls off bit 335 back to bit 0 (and vice versa). Unit tests must cover the wrap (Sat 23:30 ↔ Sun 00:00) and verify a user with a single bit set produces exactly 3 bits after dilation.

---

## 8. Pages — full route map

```
/                                Marketing landing (logo, value prop, sign-in CTA)
/sign-in                          Google + email
/verify                           Email passcode entry
/onboarding                       6-step wizard

(auth required below)
/dashboard                        "My Learning" — upcoming sessions, suggested matches, unread DMs
/find                             Browse matches (algorithm-ranked list, filter sheet)
/find/[userId]                    Public profile + "send connection request"
/connections                      Tabs: Connections | Pending | Sent
/chaburas                         Browse public chaburas (search, filter by subject)
/chaburas/new                     Create chabura
/chaburas/[slug]                  Detail: about, members, sessions, group chat tab
/chaburas/[slug]/manage           Rosh-only: edit, member approvals
/messages                         DM + chabura conversations list
/messages/[conversationId]        Conversation thread
/sessions/new?type=chavruta&with=:userId   Session creator
/sessions/new?type=chabura&for=:slug
/sessions/[id]                    Session detail: rrule summary, next 10 occurrences, edit/pause/cancel
/sessions/[id]/o/[occurrenceId]   Single occurrence: time, Meet button, cancel just this one, notes
/profile                          Self-edit
/profile/[userId]                 Public read-only
/settings                         Account, notifications, theme, sign out
/notifications                    Full notification center
```

Mobile bottom tab bar: **Home / Find / Chaburas / Messages / Profile** (5 items, no more).

### 8.1 Page details

#### `/dashboard` — Home

Sections, top to bottom on mobile:

1. **Greeting + next session card** — "Erev tov, Shimon. Your next chavruta is in 47 minutes." Big ember "Join Meeting" button if `now > startsAt - 10min`.
2. **Upcoming this week** — horizontal scroll of session occurrence cards
3. **Suggested chavrutas** — 3 top-scored matches; "See all" → `/find`
4. **Active chaburas** — small grid

Empty state for new user: a parchment-styled card with Hebrew ב watermark, "You haven't found a chavruta yet — let's fix that," CTA → `/find`.

#### `/find`

Algorithm-ranked list of users. Each card:

- avatar, name, country flag
- score badge (visual: 3 ember dots for ≥80, 2 for ≥60, 1 for ≥40)
- chips: top 2 shared subjects, "{n}h/wk overlap"
- "View" button → `/find/[userId]`

Filter sheet (top-right icon): subject (multi), language, country, level. Sort: best match (default) | most overlap | newest.

Empty state if no matches: _"We need more learners like you. Invite a friend?" + share button._

#### `/find/[userId]`

- Hero: avatar, name, bio
- "What you share" panel: subjects, languages, **exact hours/week** + **near-miss hours/week**, plus a mini heatmap that paints each slot as: yours-only (faint stone), theirs-only (faint stone), strict overlap (ember), near-miss overlap (soft ember at 50% opacity)
- Their subjects, their availability (read-only grid)
- Sticky bottom action bar: **Send connection request** | Message (disabled until connected)

#### `/connections`

3 tabs. Each connection row: avatar, name, last-active, "Message" / "Schedule chavruta" actions.

Pending tab inbox shows accept/decline. Accept triggers the **confetti + ב moment**.

#### `/chaburas`

Searchable grid of public chaburas. Card: cover image, name, subject, member count, "Open" CTA.

`/chaburas/new`: name, description, subject, public toggle, image upload, who is rosh (default = creator). On create, creator is auto-added as `rosh`.

`/chaburas/[slug]`: tabs **About | Members | Sessions | Chat**. Join button if not member. Pending state if request sent and not approved.

#### `/sessions/new`

Two paths: chavruta (target connection user pre-selected) or chabura (target chabura pre-selected).

Form:

- Subject (default = first shared subject)
- Title (auto-populated, editable)
- **RRULE Builder** — see §9.2
- Duration: chips 30/45/60/90/120
- Timezone: defaults to creator's, with note "Both of you will see this in your own timezone"
- Optional first message

On submit: create `learning_sessions` row, generate first 12 occurrences, generate Jitsi room URL and save to `meetUrl`, send notification + email to other party.

#### `/sessions/[id]`

- Header: title, subject, with whom
- RRULE in plain English: "Every Tuesday at 9:00 PM EST, 60 minutes"
- Next 10 occurrences list — each is tap-able → occurrence detail
- Buttons: Pause | Cancel series | Edit (rosh-of-chabura or chavruta-creator only)

#### `/sessions/[id]/o/[occurrenceId]`

- Date + time in viewer's timezone, with original-timezone in muted text below
- **Join Meeting** button (active in window `[startsAt - 10min, endsAt + 30min]`)
- Cancel just this occurrence | Add notes
- Past occurrences: notes are editable for 7 days

#### `/messages`

List of conversations sorted by latest activity. Unread badge ember dot. Tap → thread.

#### `/messages/[conversationId]`

Standard chat: bubbles, sender avatars, timestamps grouped by day, optimistic send. Compose bar with emoji and 1000-char limit. New messages arrive within 5s via the global poll (§12).

DMs only between accepted connections. Chabura chat shows member roster in a side sheet.

#### `/profile/[userId]` (public)

Avatar, name, bio, country, subjects, languages, total available-hours-per-week number. **Never** show the exact availability bitmap to non-connections — only the aggregate hours total and a coarse day-of-week summary (e.g., "available most evenings, weekends").

#### `/settings`

- Account: email (read-only), name, dark mode toggle
- Notifications: toggle each `notifications.type`
- Languages, timezone, country edit
- Edit availability → re-opens picker
- Sign out
- Delete account (confirms with passcode email)

---

## 9. Recurring Sessions & Scheduling

### 9.1 Generation pipeline

On session create or RRULE edit:

1. Parse RRULE with `rrule` lib in the session's `timezone` using `rrulestr(..., {tzid})` pattern
2. Iterate next **12** occurrences (covers ~3 months for weekly)
3. For each, convert wall-clock-in-tz → UTC with luxon (`DateTime.fromObject({...}, {zone: tz}).toUTC()`)
4. Insert all into `session_occurrences` in one batch with `onConflictDoNothing` on `(sessionId, startsAt)`
5. Generate Jitsi room URL once on session create and store on `learning_sessions.meetUrl` — every occurrence reuses it (§10)

### 9.2 RRULE Builder UI

A custom builder, not a generic library, tuned for this product.

Fields:

- **Frequency** — segmented control: One-time | Weekly | Bi-weekly | Monthly
- **Days** (if Weekly/Bi-weekly) — Su Mo Tu We Th Fr Sa toggle chips (multi)
- **Time** — picker, defaults to next round half-hour
- **Starts** — date picker, default today/next-occurring-day
- **Ends** — Never | After {N} occurrences | On {date}
- **Timezone** — readonly chip showing creator's TZ with edit link

Below the form, render a live preview: _"Every Tuesday and Thursday at 9:00 PM, until December 31"_ + a list of the next 5 dates rendered in viewer's TZ.

Output is an RFC 5545 RRULE string + a `dtstart` UTC timestamp.

### 9.3 Top-up cron

`vercel.json` cron daily at 03:00 UTC:

```
/api/cron/topup-occurrences
```

Logic:

```
for each session where status='active':
  count future occurrences
  if count < 10:
    expand RRULE forward until we have 12 future
    insert missing rows
```

Idempotent. Logs to a `cron_runs` table or PostHog.

### 9.4 Pause / Resume / Cancel

- **Pause**: set `status='paused'`. Keep existing future occurrences but mark them `status='cancelled'` if the user opts to "also cancel scheduled occurrences." Stop top-up.
- **Resume**: `status='active'`, run a top-up immediately.
- **Cancel series**: `status='cancelled'`, mark all future occurrences cancelled. The Jitsi URL stays valid (rooms are ephemeral) — no external cleanup needed.

---

## 10. Video Meetings

> **Superseded.** This section originally specified Jitsi Meet. The app ships on
> **LiveKit** (`livekit-client`, `livekit-server-sdk`, `@livekit/components-react`)
> with server-minted access tokens from `/api/livekit/token`. The rationale below
> for avoiding Google Meet still holds; the Jitsi implementation detail does not.
> Env vars: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL`.

The schema impact is unchanged: a session stores a room identifier, every
occurrence in the series reuses it, and swapping providers touches only the room
URL generator.


## 11. Notifications

### 11.1 Channels

- **In-app** — bell icon in header on mobile lives in top-right; desktop a popover. Updated via the 5-second poll (§12).
- **Email** — Resend, react-email templates, parchment + ember branded
- **Push** — out of scope for v1 (web push is fine to add post-launch)

### 11.2 Triggers

| Event                                | In-app    | Email                   |
| ------------------------------------ | --------- | ----------------------- |
| Connection request received          | ✓         | ✓                       |
| Connection accepted                  | ✓         | ✓                       |
| Chabura join request (to rosh)       | ✓         | ✓                       |
| Chabura join approved                | ✓         | ✓                       |
| Session invite                       | ✓         | ✓                       |
| Session starting in 10 min           | ✓         | —                       |
| Session cancelled                    | ✓         | ✓                       |
| New DM                               | ✓ (badge) | digest if unread for 1h |
| Match found (weekly digest, Sundays) | —         | ✓                       |

User-controllable per type in `/settings`.

### 11.3 "Starting soon" reminder

A second cron `/api/cron/session-reminders` every 5 minutes finds occurrences where `startsAt` is between `now+9min` and `now+11min` and the reminder hasn't been sent. Insert a `session_starting_soon` notification row — clients pick it up on their next 5-second poll.

---

## 12. Live Updates (Polling, 5s)

No websockets. The whole app stays fresh through one tiny endpoint polled every 5 seconds. The trick is that 99% of polls return zero bytes thanks to ETag/304, and the client only fires real data fetches when the poll signals that _something actually changed_.

### 12.1 The poll endpoint

```
GET /api/poll
Headers:  If-None-Match: "<last etag>"

Response (200) when changed:
{
  "etag": "v1:msg=4821:ntf=199:c=conv_a:8|conv_b:2",
  "ts": 1730000000000,
  "unread": {
    "notifications": 3,
    "messages": { "conv_abc": 2, "conv_xyz": 1 },
    "totalMessages": 3
  },
  "cursors": {
    "latestNotificationId": "ntf_199",
    "latestMessageIdByConv": { "conv_abc": "msg_4821", "conv_xyz": "msg_4818" }
  }
}

Response (304) when unchanged: empty body, ~0 bytes.
```

Server work, single round trip, two cheap indexed queries:

```sql
-- max ids the user can see
SELECT max(id) AS max_notif FROM notifications WHERE user_id = $1;

SELECT m.conversation_id,
       max(m.id) AS max_msg,
       count(*) FILTER (WHERE m.created_at > cm.last_read_at AND m.sender_id <> $1) AS unread
FROM   conversation_members cm
JOIN   messages m ON m.conversation_id = cm.conversation_id
WHERE  cm.user_id = $1
GROUP  BY m.conversation_id;
```

The ETag is a deterministic hash of those values. If the client's `If-None-Match` matches, return 304 with no body. The DB hit is two indexed queries (`messages (conversation_id, created_at desc)` and `notifications (user_id, created_at desc)`); both are already required indexes from §4.12.

### 12.2 Client hook

One global `usePoll()` mounted in the root layout:

```ts
// src/lib/poll.ts
export function usePoll() {
  const qc = useQueryClient();
  const etagRef = useRef<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function tick() {
      if (document.visibilityState !== "visible") {
        timer = setTimeout(tick, 5000); // still tick, but cheap — see below
        return;
      }
      try {
        const res = await fetch("/api/poll", {
          headers: etagRef.current ? { "If-None-Match": etagRef.current } : {},
          cache: "no-store",
        });
        if (res.status === 304) {
          /* nothing changed */
        } else if (res.ok) {
          const data = await res.json();
          etagRef.current = data.etag;

          // Selectively invalidate ONLY the data that actually moved:
          const prev = qc.getQueryData<PollState>(["poll"]);
          qc.setQueryData(["poll"], data);

          if (
            !prev ||
            prev.cursors.latestNotificationId !==
              data.cursors.latestNotificationId
          ) {
            qc.invalidateQueries({ queryKey: ["notifications"] });
          }
          for (const [convId, latest] of Object.entries(
            data.cursors.latestMessageIdByConv,
          )) {
            if (prev?.cursors.latestMessageIdByConv[convId] !== latest) {
              qc.invalidateQueries({ queryKey: ["messages", convId] });
            }
          }
        }
      } catch {
        /* swallow; try again next tick */
      }
      if (!cancelled) timer = setTimeout(tick, 5000);
    }

    tick();
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [qc]);
}
```

### 12.3 Efficiency rules

These are required, not optional:

1. **Pause when hidden.** Skip the network request entirely when `document.visibilityState !== 'visible'`. On return-to-tab, fire one immediate poll, then resume the 5s cadence.
2. **ETag/304 by default.** The client always sends `If-None-Match`. The server _must_ compare and return 304 when nothing changed. Empty 304s are 200-300 bytes total over the wire.
3. **Cursor-driven cascade.** The poll never carries message bodies or notification payloads — only IDs and counts. The actual data load happens only on the queries the poll _invalidated_. So an idle user with three browser tabs open generates ~12 KB/min of pure 304s.
4. **Single endpoint.** Don't add `/api/poll/messages` and `/api/poll/notifications`. One endpoint, one ETag, fewer connections.
5. **No cookies in the response.** Set `Cache-Control: private, no-cache` and skip Set-Cookie to keep responses small.
6. **Backoff on errors.** Two consecutive failures → bump interval to 15s until a success. Reset on focus.
7. **`messages_send` does its own optimistic update.** Don't wait 5s to see your own message — append optimistically on POST, the next poll is just confirmation.

### 12.4 Per-page tuning

- `/messages/[id]` (active conversation): supplement the global poll with a per-conversation refetch on the same 5s tick — but **only the active conversation**, not all of them.
- All other pages: rely on the global poll.
- `/dashboard` "Next session" card: re-renders the join-button window state on every poll automatically (since `now` is read each render of the card; no extra fetch needed).

### 12.5 Send path (messages)

```
POST /api/messages/conversations/[id]
  → server inserts message
  → server returns the new message row
  → client optimistic state reconciles
  → other party's next poll within 5s sees ETag changed → invalidates ['messages', convId] → fetches the thread
```

Worst-case delivery latency: 5s. Average: 2.5s. Acceptable for chavruta-coordination chat.

`lastReadAt` is updated when the conversation page mounts and on scroll-to-bottom. That update changes the unread counts in the next poll.

### 12.6 What we lose vs. websockets

- No "user is typing" indicator → cut from v1
- No presence dots → cut from v1
- 5s perceived lag on first message → acceptable

What we keep: simplicity, no Pusher/Ably bill, no auth dance, no separate infrastructure to monitor.

---

## 13. API Routes

```
POST   /api/auth/passcode/send
POST   /api/auth/passcode/verify
GET    /api/auth/[...nextauth]

GET    /api/match
POST   /api/connections                       { addresseeId }
PATCH  /api/connections/[id]                  { status: 'accepted'|'declined' }
GET    /api/connections

POST   /api/chaburas
GET    /api/chaburas
PATCH  /api/chaburas/[id]
POST   /api/chaburas/[id]/join
PATCH  /api/chaburas/[id]/members/[userId]    { role }

POST   /api/sessions                          create learning_session + occurrences + Jitsi room URL
PATCH  /api/sessions/[id]                     pause/resume/cancel/edit
GET    /api/sessions/[id]/occurrences
PATCH  /api/sessions/[id]/occurrences/[oid]   cancel/notes

GET    /api/messages/conversations
GET    /api/messages/conversations/[id]
POST   /api/messages/conversations/[id]

GET    /api/poll                              ETag-aware unread/cursor probe (5s polling)

GET    /api/notifications
PATCH  /api/notifications/[id]                mark read
POST   /api/notifications/mark-all-read

POST   /api/cron/topup-occurrences            (cron, header-protected)
POST   /api/cron/session-reminders            (cron, header-protected)
POST   /api/cron/weekly-match-digest          (cron, Sun 18:00 user-local-bucket)

GET    /api/uploadthing                       UploadThing route handler
POST   /api/uploadthing                       (auto-mounted by createRouteHandler)
```

Cron routes verify `Authorization: Bearer ${CRON_SECRET}`.

All mutating routes use **Server Actions** where called from RSC, and the API routes only for non-RSC clients (uploadthing, cron, the poll endpoint, webhooks).

---

## 14. Validation & Errors

- All inputs validated with **zod** schemas in `src/lib/validation/`
- Reusable schemas: `availabilityBitmapSchema`, `rruleSchema`, `bcp47Schema`
- Errors surface as Sonner toasts with friendly text; details to Sentry
- Server-side `assertConnected(userA, userB)` guard reused across DM + matching reveal

---

## 15. Environment Variables

See the README for the authoritative list — it is kept in sync with the vars the
code actually reads. Notably `UPLOADTHING_*` and `DIRECT_URL` from the original
spec are no longer used, and the LiveKit and Vercel Blob vars were added.

```
DATABASE_URL
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
RESEND_API_KEY
RESEND_FROM
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
NEXT_PUBLIC_LIVEKIT_URL
NEXT_PUBLIC_SITE_URL
BLOB_READ_WRITE_TOKEN
CRON_SECRET
```

---

## 16. Project Structure

> **Superseded by [`ARCHITECTURE.md`](./ARCHITECTURE.md)**, which is the enforced
> standard. The tree originally sketched here was never fully built (notably
> `server/services/`), and `ARCHITECTURE.md` reflects both what exists and what
> the checker enforces.

---

## 17. Testing

- **Vitest** unit tests for `availability.ts` — DST cases (spring forward / fall back week, learners on opposite hemispheres); dilation correctness (single bit → 3 bits; Sat 23:30 wraps to Sun 00:00); `overlap()` invariants (`exactHours + nearHours` never exceeds `popcountHours(A | B) / 2`; `near_only` and `strict` are disjoint). Also `matching.ts`, `rrule.ts`.
- **Playwright** smoke flows: sign-in (email passcode mocked) → onboard → match → request → accept → schedule session → see Meet link.
- A seed script that creates ~80 demo users across 3 timezones, 6 languages, both genders, varied subjects, varied availabilities, plus 5 demo chaburas. Runnable as `pnpm seed`.

---

## 18. Build Order (phased)

**Phase 1 — Foundations (week 1)**

1. Repo scaffold, Tailwind theme, shadcn install + recolor
2. Drizzle schema + first migration
3. NextAuth (Google + email passcode), `users` extended fields
4. Onboarding wizard (steps 1–5)
5. Marketing landing page

**Phase 2 — Availability & Matching (week 2)**

6. Availability bitmap picker (step 6)
7. `availability.ts` with DST tests
8. Subjects seed + `user_subjects`
9. Matching algorithm + `/find` page
10. Connections (request / accept / confetti moment)

**Phase 3 — Chaburas (week 3)**

11. Chaburas CRUD, browse, join flow
12. Chabura management (rosh tools)

**Phase 4 — Sessions (week 4)**

13. RRULE builder
14. Session create + occurrence generation
15. Jitsi Meet room generation + Join button window logic
16. Top-up cron + reminders cron
17. Dashboard "next session" card

**Phase 5 — Messaging & Notifications (week 5)**

18. `/api/poll` endpoint + `usePoll()` hook with ETag/304 + visibility pause
19. DM threads (with optimistic send) + chabura group chat
20. Notification center + email templates
21. Settings (notification toggles, dark mode)

**Phase 6 — Polish (week 6)**

22. All empty states, all loading skeletons
23. Sentry, PostHog, error boundaries
24. Playwright smoke pass
25. 375px audit on every page
26. Deploy

---

## 19. Definition of Done

For each page:

- [ ] Renders at 375px wide with no horizontal scroll
- [ ] Has a designed empty state with a CTA
- [ ] Has a loading skeleton matching the final layout
- [ ] Every async action shows a sonner toast on success **and** error
- [ ] Works in dark mode
- [ ] No raw `Date` arithmetic — luxon only
- [ ] Server-side authz verified (no relying on client-side hidden states)
- [ ] Hebrew text uses Frank Ruhl Libre and renders RTL where appropriate

For the product:

- [ ] A new user can sign up, onboard, find a match, send a request, get accepted, schedule a recurring session, and see a working video meeting link — in under 5 minutes on a phone
- [ ] DST transition week passes the availability test suite for at least three timezone pairs (NY/Jerusalem, LA/London, Sydney/Toronto)
- [ ] No PII (gender, exact availability, post code) is exposed to non-connected users via any API

---

## 20. Tone & Copy Notes

- Use a few well-placed Hebrew/Yiddish words: _chavruta_, _chabura_, _rosh_, _seder_, _shiur_, _erev_, _shalom_. Never overdo it. No "shalom!" greetings — that's costume.
- Empty states are warm and slightly self-aware: "No connections yet — every chavruta starts somewhere."
- Error toasts are specific: not "Something went wrong" but "We couldn't send that request — try again?"
- Email subjects are calm: _"Yossi wants to learn with you."_ Not "🎉 NEW REQUEST!!!"

---

**Build it like the beis medrash deserves it.**
