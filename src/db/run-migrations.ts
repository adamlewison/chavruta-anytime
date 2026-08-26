import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { Pool } from "pg";
import { readFile } from "fs/promises";
import { join } from "path";

const MIGRATIONS_DIR = join(__dirname, "migrations");

interface JournalEntry {
  tag: string;
}

interface Journal {
  entries: JournalEntry[];
}

function isLocalUrl(url: string): boolean {
  return /^postgres(ql)?:\/\/[^/]*(localhost|127\.0\.0\.1)/.test(url);
}

// Minimal common interface over both clients: tagged-template query + raw query.
interface SqlClient {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  tagged(strings: TemplateStringsArray, ...values: unknown[]): Promise<Record<string, unknown>[]>;
}

function makeNeonClient(url: string): SqlClient {
  const sql = neon(url) as NeonQueryFunction<false, false>;
  return {
    async query(text) {
      const rows = await sql.query(text);
      return { rows: rows as unknown as Record<string, unknown>[] };
    },
    async tagged(strings, ...values) {
      return sql(strings, ...values) as unknown as Promise<Record<string, unknown>[]>;
    },
  };
}

function makePgClient(url: string): SqlClient {
  const pool = new Pool({ connectionString: url });
  return {
    async query(text) {
      const result = await pool.query(text);
      return { rows: result.rows };
    },
    async tagged(strings, ...values) {
      const text = strings.reduce(
        (acc, part, i) => acc + part + (i < values.length ? `$${i + 1}` : ""),
        "",
      );
      const result = await pool.query(text, values);
      return result.rows;
    },
  };
}

async function runMigrations() {
  const url = process.env.DATABASE_URL!;
  const sql = isLocalUrl(url) ? makePgClient(url) : makeNeonClient(url);

  // Ensure drizzle's migration tracking table exists (same schema drizzle-kit uses)
  await sql.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
  await sql.query(`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id        SERIAL PRIMARY KEY,
      hash      TEXT NOT NULL,
      created_at BIGINT
    )
  `);

  const journal: Journal = JSON.parse(
    await readFile(join(MIGRATIONS_DIR, "meta/_journal.json"), "utf-8"),
  );

  let appliedRows = await sql.tagged`SELECT hash FROM drizzle.__drizzle_migrations`;

  // Bootstrap: if the tracking table is empty but the DB already has a schema
  // (e.g. it was set up with db:push before we introduced this runner), mark all
  // prior journal entries as applied so we don't re-run them.
  if (appliedRows.length === 0 && journal.entries.length > 1) {
    const [existing] = await sql.tagged`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    `;
    if (existing) {
      const priorEntries = journal.entries.slice(0, -1);
      for (const entry of priorEntries) {
        await sql.tagged`
          INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
          VALUES (${entry.tag}, ${Date.now()})
        `;
      }
      console.log(
        `Bootstrapped tracking table with ${priorEntries.length} pre-existing migration(s).`,
      );
      appliedRows = await sql.tagged`SELECT hash FROM drizzle.__drizzle_migrations`;
    }
  }

  const appliedSet = new Set(appliedRows.map((r) => r.hash as string));

  let count = 0;
  for (const entry of journal.entries) {
    if (appliedSet.has(entry.tag)) continue;

    const filePath = join(MIGRATIONS_DIR, `${entry.tag}.sql`);
    const content = await readFile(filePath, "utf-8");

    // Split on drizzle's statement-breakpoint marker
    const statements = content
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`Applying migration: ${entry.tag}`);
    for (const statement of statements) {
      await sql.query(statement);
    }

    await sql.tagged`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${entry.tag}, ${Date.now()})
    `;
    count++;
    console.log(`  ✓ ${entry.tag}`);
  }

  if (count === 0) {
    console.log("No pending migrations.");
  } else {
    console.log(`Applied ${count} migration(s).`);
  }
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
