"use server";

import { auth } from "@/server/auth";
import { db } from "@/db";
import { messages, conversationMembers, notifications, users } from "@/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import { sendMessageSchema, markConversationReadSchema } from "@/domain/schemas/messages";
import { firstError } from "@/domain/schemas/common";

export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = sendMessageSchema.safeParse({ conversationId, body });
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    const userId = session.user.id;

    // Verify user is member of conversation
    const [membership] = await db()
      .select()
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId),
        ),
      );

    if (!membership) {
      return { success: false, error: "Not a member of this conversation" };
    }

    // Insert message
    const [message] = await db()
      .insert(messages)
      .values({
        conversationId,
        senderId: userId,
        body,
      })
      .returning();

    // Mark conversation as read for the sender so their own message doesn't show as unread
    await db()
      .update(conversationMembers)
      .set({ lastReadAt: message.createdAt })
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId),
        ),
      );

    // Get sender name for the notification payload
    const [sender] = await db()
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId));

    // Notify all other members of this conversation
    const otherMembers = await db()
      .select({ userId: conversationMembers.userId, lastReadAt: conversationMembers.lastReadAt })
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          ne(conversationMembers.userId, userId),
        ),
      );

    for (const member of otherMembers) {
      // Only create if there isn't already an unread message_received for this conversation
      // (avoids flooding; poll will pick up new messages directly)
      const [existing] = await db()
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, member.userId),
            eq(notifications.type, "message_received"),
            sql`${notifications.payload}->>'conversationId' = ${conversationId}`,
            sql`${notifications.readAt} IS NULL`,
          ),
        )
        .limit(1);

      if (existing) {
        // Update the existing unread notification's timestamp so it surfaces at top
        await db()
          .update(notifications)
          .set({ createdAt: new Date(), payload: { conversationId, name: sender?.name ?? null } })
          .where(eq(notifications.id, existing.id));
      } else {
        await db().insert(notifications).values({
          userId: member.userId,
          type: "message_received",
          payload: { conversationId, name: sender?.name ?? null },
        });
      }
    }

    return { success: true, messageId: message.id };
  } catch (error) {
    console.error("sendMessage error:", error);
    return { success: false, error: "Failed to send message" };
  }
}

export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  try {
    const session = await auth();
    if (!session?.user?.id) return;

    if (!markConversationReadSchema.safeParse(conversationId).success) return;

    const userId = session.user.id;

    await db()
      .update(conversationMembers)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId),
        ),
      );
  } catch (error) {
    console.error("markConversationRead error:", error);
  }
}
