import { db } from "@/db";
import { subjects } from "@/db/schema";
import { asc } from "drizzle-orm";

/** Subject id + name, ordered for a select list. */
export async function listSubjectOptions() {
  return db()
    .select({ id: subjects.id, name: subjects.name })
    .from(subjects)
    .orderBy(asc(subjects.sortOrder), asc(subjects.name));
}

/** Subject slug + name, ordered for a select list. */
export async function listSubjectSlugs() {
  return db()
    .select({ slug: subjects.slug, name: subjects.name })
    .from(subjects)
    .orderBy(asc(subjects.sortOrder), asc(subjects.name));
}
