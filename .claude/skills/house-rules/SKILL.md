---
name: house-rules
description: Audit this repository against ARCHITECTURE.md. Runs the deterministic check, then reviews what a script cannot judge — whether names are good, whether modules sit in the right conceptual place, whether abstractions are at the right altitude, and whether the architecture doc has drifted from the actual tree. Use when asked to review architecture, check house rules, audit structure, or on the weekly scheduled run.
---

# House rules review

Two passes. The script catches mechanical violations; you catch the ones that need judgement. Do not re-report what the script already found — your value is entirely in the second pass.

## Pass 1 — deterministic

```bash
pnpm check:arch
```

Record: new violations (should be 0), baseline count, annotated exceptions.

Then check whether the baseline is shrinking:

```bash
git log --oneline -20 -- scripts/architecture-baseline.json
node -e "console.log(require('./scripts/architecture-baseline.json').entries.length)"
```

The baseline must only ever go down. **If it grew, that is the finding** — report it first and identify the commit that raised it.

## Pass 2 — judgement

Read `ARCHITECTURE.md` first; it is the standard you are reviewing against. Then assess the five things no linter can:

**1. Are names *good*, not merely correctly cased?**
`ARCH004` proves a file is kebab-case. It cannot tell you that `utils.ts`, `helpers.ts`, `data.ts`, or `manager.ts` say nothing about what is inside, that `matches.ts` and `match.ts` sitting side by side is a trap, or that a name describes the implementation rather than the concept. Flag names a newcomer would have to open the file to understand.

**2. Does each module sit in the right conceptual place?**
Walk anything added or moved recently:

```bash
git diff --name-status HEAD~10..HEAD -- src/
```

For each, ask: does its directory match what it actually does? Common failures — a React hook outside `src/hooks/`, static reference data in a logic module, a query helper living next to its one caller instead of in `server/queries/`, framework-coupled code in `src/domain/`.

**3. Is each abstraction at the right altitude?**
Both directions are defects. Too low: a "helper" wrapping one call with no added meaning, or a shared component with nine boolean props that is really three components. Too high: the same 20-line query duplicated across four route files because nobody extracted it. Look for near-duplicate logic:

```bash
grep -rn "await db()" src/app/ | head -40
```

**4. Has the doc drifted from the tree?**
Compare `ARCHITECTURE.md` §1 against reality:

```bash
find src -maxdepth 2 -type d | sort
```

Every directory in the tree must appear in the doc, and every directory in the doc must exist or be an explicitly stated target. Report both directions. Also verify the README's stack table against `package.json` — this repo has drifted there before.

**5. What new patterns emerged?**
Look for conventions the code now follows that the doc does not mention. Each is a fork: either it is good and the doc should adopt it, or it is drift and the code should change. Say which, and why. A rule nobody wrote down is a rule that will be broken.

## Output

A report in this shape:

```
## Deterministic
0 new · N baselined (was M, ↓/↑) · K exceptions

## Judgement findings
### <finding title>
file:line — what is wrong, why it matters, the specific fix.

## Doc drift
...

## Emerged patterns
<pattern> → adopt into doc / remove from code, because ...
```

Rank findings by cost of leaving them. Do not pad — if the only finding is that the baseline did not shrink this week, say exactly that and stop.

## Fixes

Where a fix is **unambiguous and mechanical** — a rename, a move to the correct directory, deleting a confirmed orphan — apply it and open a PR:

- One concern per PR. Never mix a move with a logic change.
- Use `git mv` so history follows the file.
- Run `pnpm check` (lint + typecheck + test + arch) before pushing.
- Regenerate the baseline with `pnpm check:arch --update-baseline` if the change fixed baselined violations, and state the before/after count in the PR body.

Where a fix requires a judgement call — splitting a module, renaming a domain concept, changing a layer boundary — **report it, do not apply it**. Propose the change and let a human decide.
