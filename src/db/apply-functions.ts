import { neon } from "@neondatabase/serverless";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

function splitSqlStatements(content: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inDollarQuote = false;

  for (let i = 0; i < content.length; i++) {
    if (content[i] === "$" && content[i + 1] === "$") {
      inDollarQuote = !inDollarQuote;
      current += "$$";
      i++;
    } else if (content[i] === ";" && !inDollarQuote) {
      current += ";";
      const trimmed = current.trim();
      if (trimmed && trimmed !== ";") statements.push(trimmed);
      current = "";
    } else {
      current += content[i];
    }
  }

  const trimmed = current.trim();
  if (trimmed) statements.push(trimmed);
  return statements;
}

async function applyFunctions() {
  const sql = neon(process.env.DATABASE_URL!);
  const dir = join(__dirname, "functions");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const content = await readFile(join(dir, file), "utf-8");
    console.log(`Applying ${file}...`);
    for (const stmt of splitSqlStatements(content)) {
      await sql.query(stmt);
    }
  }

  console.log(`Applied ${files.length} function(s).`);
}

applyFunctions().catch((err) => {
  console.error(err);
  process.exit(1);
});
