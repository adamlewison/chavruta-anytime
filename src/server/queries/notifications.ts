import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

/** Most recent notifications for a user, newest first. */
export async function listNotifications(userId: string, limit = 50) {
  return db()
    .select({
      id: notifications.id,
      type: notifications.type,
      payload: notifications.payload,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/** Latest notification timestamp + unread count, for the poll endpoint's cursor/badge. */
export async function getNotificationPollState(userId: string) {
  const [row] = await db()
    .select({
      latestId: sql<string | null>`max(${notifications.createdAt})`,
      unreadCount: sql<number>`count(*) filter (where ${notifications.readAt} is null)`,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId));
  return row;
}

/** True when a "session_starting_soon" notification already exists for this occurrence. */
export async function hasSessionStartingSoonNotification(occurrenceId: string) {
  const existing = await db()
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(
        eq(notifications.type, "session_starting_soon"),
        sql`${notifications.payload}->>'occurrenceId' = ${occurrenceId}`,
      ),
    );
  return Number(existing[0]?.count ?? 0) > 0;
}
