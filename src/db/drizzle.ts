import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import { resolve } from "path";

const root = process.cwd();

// Load .env.local into process.env (skip comments and blank lines)
try {
  const raw = readFileSync(resolve(root, ".env.local"), "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
} catch {
  // No .env.local — rely on environment already being set
}

const [, , ...args] = process.argv;
const result = spawnSync("drizzle-kit", args, { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
