import { db } from "@/db";
import { users, userSubjects, subjects } from "@/db/schema";
import { eq } from "drizzle-orm";

/** A user's public profile fields plus their raw availability bitmap, for the profile page. */
export async function getPublicProfileWithAvailability(userId: string) {
  const [row] = await db()
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      bio: users.bio,
      country: users.country,
      timezone: users.timezone,
      languages: users.languages,
      availability: users.availability,
    })
    .from(users)
    .where(eq(users.id, userId));
  return row ?? null;
}

/** A user's subjects with Hebrew names, for the profile page's interests list. */
export async function listUserSubjectsWithHebrew(userId: string) {
  return db()
    .select({
      name: subjects.name,
      hebrewName: subjects.hebrewName,
    })
    .from(userSubjects)
    .innerJoin(subjects, eq(userSubjects.subjectId, subjects.id))
    .where(eq(userSubjects.userId, userId));
}
