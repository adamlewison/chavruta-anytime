import { neon } from "@neondatabase/serverless";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

async function applyFunctions() {
  const sql = neon(process.env.DATABASE_URL!);
  const dir = join(__dirname, "functions");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const content = await readFile(join(dir, file), "utf-8");
    console.log(`Applying ${file}...`);
    await sql.query(content);
  }

  console.log(`Applied ${files.length} function(s).`);
}

applyFunctions().catch((err) => {
  console.error(err);
  process.exit(1);
});
