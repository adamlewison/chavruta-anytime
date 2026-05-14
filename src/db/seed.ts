import { db } from "@/db"; // Your Drizzle DB instance
import { subjects } from "./schema";
import { SEED_SUBJECTS } from "@/db/seed/subjects";

async function seed() {
  await db().insert(subjects).values(SEED_SUBJECTS);
  console.log("Seeding complete");
}
seed();
