import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

await sql.query("DROP SCHEMA public CASCADE");
await sql.query("CREATE SCHEMA public");

console.log("Database cleared.");
