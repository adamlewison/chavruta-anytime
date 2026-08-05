import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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
