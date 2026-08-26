import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// The node-postgres driver (used locally, see isLocalUrl) implements the same
// query-builder surface as neon-http; we type both as NeonHttpDatabase so callers
// don't have to deal with a union across Drizzle's slightly different overloads.
export type DB = NeonHttpDatabase<typeof schema>;

function isLocalUrl(url: string): boolean {
  return /^postgres(ql)?:\/\/[^/]*(localhost|127\.0\.0\.1)/.test(url);
}

let _db: DB | null = null;

export function db(): DB {
  if (!_db) {
    const url = process.env.DATABASE_URL!;
    if (isLocalUrl(url)) {
      _db = drizzlePg(new Pool({ connectionString: url }), { schema }) as unknown as DB;
    } else {
      _db = drizzleNeon(neon(url), { schema });
    }
  }
  return _db;
}
