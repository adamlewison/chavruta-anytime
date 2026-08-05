"use server";

import { auth } from "@/server/auth";
import { db } from "@/db";
import { notifications, userNotificationSettings } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { setNotificationSettingSchema, markNotificationReadSchema } from "@/domain/schemas/notifications";
import { firstError } from "@/domain/schemas/common";

export type NotificationType =
  | "connection_request"
  | "connection_accepted"
  | "chabura_invite"
  | "chabura_request"
  | "session_invite"
  | "session_starting_soon"
  | "session_starting_now"
  | "session_cancelled"
  | "message_received"
  | "match_found";

export type NotificationChannel = "in_app" | "email" | "push";

/**
 * Creates a notification for an arbitrary user. Used by system callers (cron
 * jobs, other actions) that act on behalf of someone other than the signed-in
 * user, so unlike the rest of this module it does not check auth() itself.
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
) {
  await db().insert(notifications).values({ userId, type, payload });
}

// Returns a set of keys "{type}_{channel}" that are explicitly disabled.
// Missing from the set = enabled (sparse strategy).
export async function getNotificationSettings(): Promise<{
  disabled: Set<string>;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { disabled: new Set(), error: "Not authenticated" };

    const rows = await db()
      .select({
        type: userNotificationSettings.type,
        channel: userNotificationSettings.channel,
        isEnabled: userNotificationSettings.isEnabled,
      })
      .from(userNotificationSettings)
      .where(eq(userNotificationSettings.userId, session.user.id));

    const disabled = new Set(
      rows
        .filter((r) => !r.isEnabled)
        .map((r) => `${r.type}_${r.channel}`),
    );

    return { disabled };
  } catch (e) {
    console.error("getNotificationSettings error:", e);
    return { disabled: new Set(), error: "Failed to load settings" };
  }
}

export async function setNotificationSetting(
  type: NotificationType,
  channel: NotificationChannel,
  isEnabled: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    const parsed = setNotificationSettingSchema.safeParse({ type, channel, isEnabled });
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    if (isEnabled) {
      // Restore default: delete the row so missing = enabled
      await db()
        .delete(userNotificationSettings)
        .where(
          and(
            eq(userNotificationSettings.userId, session.user.id),
            eq(userNotificationSettings.type, type),
            eq(userNotificationSettings.channel, channel),
          ),
        );
    } else {
      // Explicitly disable: upsert a row with is_enabled = false
      await db()
        .insert(userNotificationSettings)
        .values({
          userId: session.user.id,
          type,
          channel,
          isEnabled: false,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            userNotificationSettings.userId,
            userNotificationSettings.type,
            userNotificationSettings.channel,
          ],
          set: { isEnabled: false, updatedAt: new Date() },
        });
    }

    return { success: true };
  } catch (e) {
    console.error("setNotificationSetting error:", e);
    return { success: false, error: "Failed to save setting" };
  }
}

export async function markNotificationRead(
  notificationId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = markNotificationReadSchema.safeParse(notificationId);
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    await db()
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, session.user.id),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("markNotificationRead error:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

export async function markAllRead(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    await db()
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, session.user.id),
          sql`${notifications.readAt} IS NULL`,
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("markAllRead error:", error);
    return { success: false, error: "Failed to mark all notifications as read" };
  }
}
