# Architecture

**[`ARCHITECTURE.md`](./ARCHITECTURE.md) is the law for where code lives.** Read it before creating, moving, or renaming any file. It defines the directory tree, naming rules, layer boundaries, size budgets, and a "where does this go?" recipe for every common task.

The rules you will hit most often:

- **Only `src/server/**` and `src/db/**` may import `@/db`.** Never query the database from a route file or a component.
- **Every Server Action must authorize (`auth()`) *and* validate its input** against a schema from `@/domain/schemas`.
- **`src/domain/**` is framework-free** — no `next`, no `react` imports.
- **Don't add files to `src/lib/`.** It is a leaf-utility slot, not a destination.
- **Import via `@/`.** No `../../`.

Run `pnpm check:arch` before you finish. It exits non-zero with `file:line` and the rule broken. Pre-existing violations live in `scripts/architecture-baseline.json`, which only ever shrinks — never add to it to dodge a rule.
