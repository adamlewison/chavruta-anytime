"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  connections,
  notifications,
  conversations,
  conversationMembers,
  users,
} from "@/db/schema";
import { eq, and, or } from "drizzle-orm";

export async function sendConnectionRequest(
  addresseeId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    if (userId === addresseeId) {
      return { success: false, error: "Cannot connect with yourself" };
    }

    // Check for existing connection between the pair
    const existing = await db()
      .select()
      .from(connections)
      .where(
        or(
          and(
            eq(connections.requesterId, userId),
            eq(connections.addresseeId, addresseeId),
          ),
          and(
            eq(connections.requesterId, addresseeId),
            eq(connections.addresseeId, userId),
          ),
        ),
      );

    if (existing.length > 0) {
      return { success: false, error: "Connection already exists" };
    }

    // Insert connection
    await db().insert(connections).values({
      requesterId: userId,
      addresseeId,
      status: "pending",
    });

    // Get sender name for notification
    const [requester] = await db()
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId));

    // Create notification for addressee
    await db().insert(notifications).values({
      userId: addresseeId,
      type: "connection_request",
      payload: { fromUserId: userId, name: requester?.name ?? null },
    });

    return { success: true };
  } catch (error) {
    console.error("sendConnectionRequest error:", error);
    return { success: false, error: "Failed to send connection request" };
  }
}

export async function respondToConnection(
  connectionId: string,
  status: "accepted" | "declined",
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Get the connection
    const [connection] = await db()
      .select()
      .from(connections)
      .where(eq(connections.id, connectionId));

    if (!connection) {
      return { success: false, error: "Connection not found" };
    }

    if (connection.addresseeId !== userId) {
      return { success: false, error: "Not authorized to respond to this connection" };
    }

    // Update connection status
    await db()
      .update(connections)
      .set({ status, respondedAt: new Date() })
      .where(eq(connections.id, connectionId));

    if (status === "accepted") {
      // Get acceptor name
      const [acceptor] = await db()
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, userId));

      // Notify the requester
      await db().insert(notifications).values({
        userId: connection.requesterId,
        type: "connection_accepted",
        payload: { fromUserId: userId, name: acceptor?.name ?? null },
      });

      // Create a DM conversation between the two users
      const [conversation] = await db()
        .insert(conversations)
        .values({ type: "dm" })
        .returning();

      await db().insert(conversationMembers).values([
        { conversationId: conversation.id, userId: connection.requesterId },
        { conversationId: conversation.id, userId: connection.addresseeId },
      ]);
    }

    return { success: true };
  } catch (error) {
    console.error("respondToConnection error:", error);
    return { success: false, error: "Failed to respond to connection" };
  }
}
