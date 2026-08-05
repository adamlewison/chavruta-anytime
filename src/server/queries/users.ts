import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Reads of the signed-in user's own record, used by the settings pages.
 *
 * Each function selects only the columns its caller renders. That is
 * deliberate: these run on every settings navigation, and the users table
 * carries the availability bitmap, which there is no reason to ship to a page
 * that only needs a timezone.
 *
 * Callers are responsible for authenticating and passing their own userId —
 * these do not call auth() themselves, so they stay trivially testable and
 * cannot accidentally read someone else's row.
 */

export async function getUserHeader(userId: string) {
  const [row] = await db()
    .select({ name: users.name, image: users.image })
    .from(users)
    .where(eq(users.id, userId));
  return row ?? null;
}

export async function getUserEmail(userId: string) {
  const [row] = await db()
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));
  return row?.email ?? null;
}

export async function getUserLocation(userId: string) {
  const [row] = await db()
    .select({ country: users.country, timezone: users.timezone })
    .from(users)
    .where(eq(users.id, userId));
  return row ?? null;
}

export async function getUserTimezone(userId: string) {
  const [row] = await db()
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, userId));
  return row?.timezone ?? null;
}

export async function getUserPublicProfile(userId: string) {
  const [row] = await db()
    .select({
      email: users.email,
      name: users.name,
      bio: users.bio,
      country: users.country,
      timezone: users.timezone,
      image: users.image,
      gender: users.gender,
      profileVisible: users.profileVisible,
    })
    .from(users)
    .where(eq(users.id, userId));
  return row ?? null;
}

export async function getLinkedAccounts(userId: string) {
  return db()
    .select({
      provider: accounts.provider,
      providerAccountId: accounts.providerAccountId,
    })
    .from(accounts)
    .where(eq(accounts.userId, userId));
}
