#!/usr/bin/env node
/**
 * Deterministic architecture check. See ARCHITECTURE.md for the rules themselves.
 *
 *   pnpm check:arch                     fail on any violation not in the baseline
 *   pnpm check:arch --update-baseline   re-record the baseline (it may only shrink)
 *
 * Baseline entries are keyed by rule + file, not line, so that unrelated edits
 * don't churn the file. A violation is "new" if its rule+file pair is unknown.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const BASELINE = path.join(ROOT, "scripts", "architecture-baseline.json");
const UPDATE = process.argv.includes("--update-baseline");

const RULES = {
  ARCH001: "Only src/server/** and src/db/** may import @/db",
  ARCH002: "src/domain/** must not import next, react, @/db, @/server or @/components",
  ARCH003: "No deep relative imports (../..) — use @/",
  ARCH004: "Filenames must be kebab-case",
  ARCH005: "File exceeds 300 LOC",
  ARCH006: "Route file exceeds 150 LOC",
  ARCH007: "Hooks must live in src/hooks and be named use-*",
  ARCH008: "Server Action module must validate input (safeParse/parse)",
  ARCH009: 'No "use client" in src/server or src/domain',
  ARCH010: "Third-party SDK client (or process.env read) constructed at module scope — wrap in a lazy accessor",
};

const ROUTE_FILES = new Set([
  "page", "layout", "route", "loading", "error",
  "not-found", "template", "default", "global-error",
]);

const files = execFileSync(
  "git", ["ls-files", "src/**/*.ts", "src/**/*.tsx", "src/*.ts"],
  { cwd: ROOT, encoding: "utf8" }
).trim().split("\n").filter(Boolean);

const violations = [];
const exceptions = [];

const add = (rule, file, line) => violations.push({ rule, file, line });

for (const file of files) {
  const abs = path.join(ROOT, file);
  if (!existsSync(abs)) continue;
  const src = readFileSync(abs, "utf8");
  const lines = src.split("\n");

  const inApp = file.startsWith("src/app/");
  const inDomain = file.startsWith("src/domain/");
  const inServer = file.startsWith("src/server/");
  const inDb = file.startsWith("src/db/");
  const inHooks = file.startsWith("src/hooks/");
  const base = path.basename(file).replace(/\.tsx?$/, "");
  const stem = base.replace(/\.(test|d|config)$/, "");
  const isRoute = ROUTE_FILES.has(base);
  const isTest = /\.test$/.test(base);

  // Escape hatches: "// architecture-exception: ARCH00X — reason"
  const exempt = new Set();
  lines.forEach((l, i) => {
    const m = l.match(/architecture-exception:\s*(ARCH\d{3})/);
    if (m) { exempt.add(m[1]); exceptions.push({ rule: m[1], file, line: i + 1 }); }
  });

  // --- ARCH005 / ARCH006: size budgets ---
  if (!isTest && lines.length > 300 && !exempt.has("ARCH005")) add("ARCH005", file, lines.length);
  if (isRoute && lines.length > 150 && !exempt.has("ARCH006")) add("ARCH006", file, lines.length);

  // --- ARCH004: filename casing (app/ uses Next reserved + [param]/(group) names) ---
  if (!inApp && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(stem) && !exempt.has("ARCH004")) {
    add("ARCH004", file, 1);
  }

  // --- ARCH009: server/domain must not be client modules ---
  if ((inServer || inDomain) && /^\s*["']use client["']/m.test(src) && !exempt.has("ARCH009")) {
    add("ARCH009", file, lines.findIndex((l) => /use client/.test(l)) + 1);
  }

  // --- ARCH008: actions must validate ---
  if (
    file.startsWith("src/server/actions/") &&
    /export\s+async\s+function/.test(src) &&
    !/\.safeParse\(|\.parse\(/.test(src) &&
    !exempt.has("ARCH008")
  ) {
    add("ARCH008", file, 1);
  }

  // --- ARCH007: hook placement ---
  if (!inHooks && /export\s+(async\s+)?function\s+use[A-Z]/.test(src) && !exempt.has("ARCH007")) {
    add("ARCH007", file, lines.findIndex((l) => /export\s+(async\s+)?function\s+use[A-Z]/.test(l)) + 1);
  }

  // --- ARCH010: SDK client / required-env-var read at module scope ---
  // Heuristic: an unindented (module-scope, not inside a function body)
  // assignment that both `new`s something and reads process.env inline.
  if ((inServer || inDb) && !exempt.has("ARCH010")) {
    lines.forEach((line, i) => {
      if (/^(export\s+)?const\s+\w+.*=\s*new\s+[A-Z]\w*\(.*process\.env/.test(line)) {
        add("ARCH010", file, i + 1);
      }
    });
  }

  // --- import-based rules ---
  lines.forEach((line, i) => {
    const m = line.match(/(?:from|import)\s+["']([^"']+)["']/);
    if (!m) return;
    const spec = m[1];
    const n = i + 1;

    if (spec === "@/db" || spec.startsWith("@/db/")) {
      if (!inServer && !inDb && !exempt.has("ARCH001")) add("ARCH001", file, n);
    }
    if (inDomain && !exempt.has("ARCH002")) {
      if (/^(next|react|react-dom)(\/|$)/.test(spec) ||
          spec.startsWith("@/db") || spec.startsWith("@/server") || spec.startsWith("@/components")) {
        add("ARCH002", file, n);
      }
    }
    if (spec.startsWith("../../") && !exempt.has("ARCH003")) add("ARCH003", file, n);
  });
}

// ---------- baseline reconciliation ----------
const key = (v) => `${v.rule}|${v.file}`;
const current = new Map();
for (const v of violations) if (!current.has(key(v))) current.set(key(v), v);

if (UPDATE) {
  const entries = [...current.keys()].sort();
  writeFileSync(BASELINE, JSON.stringify({ entries }, null, 2) + "\n");
  console.log(`Baseline updated: ${entries.length} recorded violation(s).`);
  process.exit(0);
}

const baseline = existsSync(BASELINE)
  ? new Set(JSON.parse(readFileSync(BASELINE, "utf8")).entries)
  : new Set();

const fresh = [...current.values()].filter((v) => !baseline.has(key(v)));
const stale = [...baseline].filter((k) => !current.has(k));

for (const v of fresh.sort((a, b) => a.file.localeCompare(b.file))) {
  console.error(`${v.file}:${v.line}  ${v.rule}  ${RULES[v.rule]}`);
}

const held = current.size - fresh.length;
console.log(
  `\n${fresh.length} new · ${held} baselined · ${exceptions.length} annotated exception(s)`
);

if (stale.length) {
  console.log(`\n${stale.length} baseline entr(ies) now fixed — run 'pnpm check:arch --update-baseline' to shrink:`);
  for (const k of stale.slice(0, 10)) console.log(`  ${k.replace("|", "  ")}`);
}

if (fresh.length) {
  console.error(`\nFAIL — see ARCHITECTURE.md. Fix these, or justify with an architecture-exception comment.`);
  process.exit(1);
}
console.log("OK — no new architecture violations.");
