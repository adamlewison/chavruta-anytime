# Architecture

The rules for where code lives in this repository. This file is **prescriptive** — it is the standard, not a description of the current tree. Existing violations are recorded in `scripts/architecture-baseline.json` and are being worked down; they are not precedent.

Enforced by `pnpm check:arch` (deterministic) and the `house-rules` skill (judgement). Run `pnpm check:arch` before opening a PR.

Framework conventions here are pinned to **Next.js 16 App Router**. Before changing anything structural, read `node_modules/next/dist/docs/` for the installed version — not from memory.

---

## 1. Directory tree

```
src/
  app/            Routing ONLY. No business logic, no DB access.
    (app)/          Authenticated routes
    (auth)/         Sign-in / verify
    (call)/         Full-screen call surface
    api/            Route handlers (cron, webhooks, polling, non-RSC clients)
  components/
    ui/             shadcn primitives. Generated/vendored — edit sparingly.
    <feature>/      Feature-owned components (sessions/, chaburas/, ...)
    providers.tsx   App-wide React context providers
  domain/         Pure business logic. MUST NOT import next, react, or @/db.
    schemas/        Zod schemas — the single source of truth for input shapes
  server/         Server-only code. Never imported by a "use client" module.
    queries/        Reads. The ONLY place permitted to read the database.
    actions/        Writes. Server Actions ("use server").
    auth.ts         Auth.js configuration
  db/             Drizzle client, schema, migrations. Owns the DB connection.
    schema/         Table definitions, one file per domain area
    migrations/     Generated SQL — never hand-edited
    functions/      Hand-written SQL functions. See §8 — this is real business
                    logic and is held to the same standard as TypeScript.
  hooks/          ALL React hooks. No exceptions.
  config/         Static reference data and env access (languages, timezones)
  lib/            Cross-cutting leaf utilities only. See §6 — this is not a catch-all.
  types/          Ambient declarations and module augmentation (*.d.ts)
  styles/         Global CSS
  proxy.ts        Next 16 proxy (formerly middleware.ts)
```

---

## 2. Naming

| Entity | Rule | Example |
|---|---|---|
| Files and directories | `kebab-case` | `new-session-form.tsx` |
| Route files | Next.js reserved names | `page.tsx`, `route.ts`, `layout.tsx` |
| React components | `PascalCase` export, kebab-case file | `export function NewSessionForm()` |
| Hooks | file `use-*.ts`, export `useX` | `use-poll.ts` → `usePoll()` |
| Types / interfaces | `PascalCase`, no `I` prefix | `type SessionContext` |
| Functions | `camelCase`, verb-first | `getStudyMatches()` |
| Constants | `SCREAMING_SNAKE_CASE` | `BASE_INTERVAL` |
| Query functions | `get*` (one) / `list*` (many) | `getDashboardSessions()` |
| Action functions | imperative verb-first | `createChabura()` |
| Zod schemas | `<thing>Schema` | `createSessionSchema` |
| DB tables | `snake_case` plural | `session_occurrences` |
| DB columns in TS | `camelCase` (Drizzle maps them) | `startsAt` |
| Env vars | `SCREAMING_SNAKE_CASE` | `CRON_SECRET` |
| Tests | `<source>.test.ts`, colocated | `matching.ts` → `matching.test.ts` |

---

## 3. Layer rules

Permitted import directions. An arrow means "may import".

```
app        →  components, hooks, server, domain, config, lib, types
components →  components, hooks, domain, config, lib, types, server/actions
hooks      →  domain, config, lib, server/actions
server     →  db, domain, config, lib, types
domain     →  domain, config          (+ pure npm packages only)
db         →  (nothing internal)
config     →  (nothing internal)
lib        →  (nothing internal)
```

Four hard rules, all machine-checked:

1. **`@/db` may only be imported from `src/server/**` and `src/db/**`.** Route files, components, and hooks never touch the database.
2. **`src/domain/**` must not import `next`, `react`, `@/db`, `@/server`, or `@/components`.** Domain logic must be runnable and testable without the framework.
3. **`src/app/**` files contain no DB access and no business logic.** A route file authenticates, calls a query or renders a component, and returns.
4. **Always import via `@/`.** Deep relative imports (`../../`) are banned. Same-directory `./` is fine.
5. **Third-party SDK clients and anything reading a required env var must be constructed lazily, inside a function, never at module scope.** Module-scope construction (`export const resend = new Resend(process.env.RESEND_API_KEY)`) makes that env var a build-time dependency for every module that transitively imports it, even ones that never call it. Export an accessor that constructs and memoises on first call instead — see `db()` in `src/db/index.ts` or `resend()` in `src/server/email.ts`.

---

## 4. Size budgets

| Unit | Budget | Remedy when exceeded |
|---|---|---|
| Any file | 300 LOC | Split by concern — not by arbitrary line count |
| Function | 50 LOC | Extract named helpers |
| Route file (`page`/`layout`/`route`) | 150 LOC | Move data fetching to `server/queries/`, interactive UI to a client component |
| Server action module | 250 LOC | Split per entity, or extract shared logic into `domain/` |

Budgets protect an already-healthy distribution (86% of files are ≤200 LOC). They are not a mandate to refactor working code the moment it crosses a line — but a PR that pushes a file over budget must split it.

---

## 5. Decision recipes

**Adding a page** → `src/app/(app)/<route>/page.tsx`. Auth-check, call a query from `server/queries/`, render components. If it exceeds 150 LOC, you are doing too much in it.

**Adding an API route** → `src/app/api/<name>/route.ts`. Only for non-RSC consumers: cron, webhooks, polling, uploads. Mutations from the app UI use Server Actions instead.

**Reading from the database** → add a function to `src/server/queries/<entity>.ts`. This is the only place `db()` may be called for reads. Return plain serializable data, not Drizzle builders.

**Writing to the database** → add a Server Action in `src/server/actions/<entity>.ts`. Every action must, in order: (1) `await auth()` and authorize, (2) `safeParse` its input against a schema from `@/domain/schemas`, (3) perform the write, (4) return `{ success: true, ... }` or `{ success: false, error }`.

**Adding a shared component** → `src/components/<feature>/`. If it is a generic primitive with no product meaning, `src/components/ui/`. A component used by exactly one route may be colocated next to that route.

**Adding pure logic** (scoring, date math, bitmaps, parsing) → `src/domain/<topic>.ts`, with `src/domain/<topic>.test.ts` next to it. No framework imports.

**Adding a hook** → `src/hooks/use-<thing>.ts`. Never `lib/`, never colocated in a component file.

**Adding a validation schema** → `src/domain/schemas/<entity>.ts`. Derive TypeScript types from the schema with `z.infer` — do not hand-write a parallel type.

**Adding a background job** → route handler under `src/app/api/cron/<name>/route.ts`, guarded by `CRON_SECRET`, registered in `vercel.json`. Logic lives in `server/` — the handler is a thin trigger.

**Adding static reference data** (country lists, timezones, language codes) → `src/config/<name>.ts`.

---

## 6. Anti-patterns

| Banned | Why |
|---|---|
| `db()` inside `src/app/` or `src/components/` | Untestable without a live request; leads to the same query duplicated across routes |
| A Server Action that does not `safeParse` its input | Actions are public POST endpoints. Authorization answers *who*; only validation answers *what* |
| Adding a file to `src/lib/` | `lib/` is a leaf-utility slot, not a destination. If it has a domain, a layer, or React in it, it belongs elsewhere. This directory previously accumulated five unrelated categories in three months |
| A shared type defined in a consumer module | Creates import cycles. Put shared types in the module that owns the concept, or in `types/` |
| Deep relative imports (`../../`) | Breaks on move, hides layer violations |
| Barrel files for features | Defeats tree-shaking and hides real dependency edges. Barrels are allowed only for `db/schema` and vendored primitives |
| One feature's components importing another's | Feature dirs are peers. Shared UI moves up to `components/ui/` or the shared layer |
| `"use client"` in `src/server/` or `src/domain/` | These layers must stay server-safe and framework-free respectively |
| Hand-editing `src/db/migrations/` | Generated artifacts. Change the schema and regenerate |
| Constructing a third-party SDK client (or reading a required env var) at module scope | Forces that env var to be present at build time for every transitive importer — invisible to `tsc`, only caught by `pnpm build`. Wrap it in a lazily-memoised accessor function instead, e.g. `db()` / `resend()` |

---

## 7. Escape hatches

Deviations are allowed when justified, never when silent.

**For a one-off**, annotate the line and state why:

```ts
// architecture-exception: ARCH001 — cron handler needs a raw transactional
// connection that the query layer does not expose. Revisit when it does.
```

The checker honours the annotation, records it, and reports the total count. A rising count is a signal the rule is wrong.

**For pre-existing violations**, they are already in `scripts/architecture-baseline.json`. That file only ever shrinks — `pnpm check:arch` fails if a new violation appears, and the baseline is regenerated (smaller) after each cleanup batch.

**If a rule is wrong**, change this document and the checker in the same PR. Do not quietly deviate, and do not add to the baseline to dodge a rule.

---

## 8. Business logic in SQL

Some logic lives in Postgres functions under `src/db/functions/*.sql`, applied with
`pnpm db:functions`. Match scoring is the current example: `get_study_profile_matches`
does subject, language, availability and proximity scoring entirely in SQL.

This is a legitimate third home for business logic — it is far cheaper to score
candidates next to the data than to pull every user into Node. But it is invisible to
the type system, the linter, and the test suite, so it carries extra obligations:

1. **One implementation per algorithm.** Never keep a TypeScript version of logic that
   ships in SQL. This repo previously carried both a `lib/matching.ts` and the SQL
   scorer with *different weights*, plus a dead `actions/match.ts` calling the stale
   one — three artifacts, two behaviours, one live path. Delete the loser.
2. **Every function file names its callers.** A header comment listing which
   `server/queries/` or `server/actions/` modules invoke it, because nothing else
   links them.
3. **Functions are `CREATE OR REPLACE` and idempotent**, so `pnpm db:functions` is
   safe to re-run. Never edit a generated file in `migrations/` to change one.
4. **Document the scoring contract** — inputs, output columns, and the weighting — in
   the file header. A reviewer must not have to reverse-engineer the weights.

Rule of thumb: use SQL when the work is set-shaped and data-adjacent. Use `src/domain/`
when the work is rule-shaped and needs tests. If you find yourself wanting both, you
want one — pick it deliberately and delete the other.

---
