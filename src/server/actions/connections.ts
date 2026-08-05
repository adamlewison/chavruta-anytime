"use server";

import { auth } from "@/server/auth";
import { db } from "@/db";
import {
  connections,
  notifications,
  conversations,
  conversationMembers,
  users,
} from "@/db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export async function getMyChavrutas(limit = 6): Promise<
  Array<{ userId: string; name: string | null; image: string | null }>
> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const userId = session.user.id;

  const requesterUser = alias(users, "requester_user");
  const addresseeUser = alias(users, "addressee_user");

  return db()
    .select({
      userId: sql<string>`CASE WHEN ${connections.requesterId} = ${userId} THEN ${connections.addresseeId} ELSE ${connections.requesterId} END`,
      name: sql<string | null>`CASE WHEN ${connections.requesterId} = ${userId} THEN ${addresseeUser.name} ELSE ${requesterUser.name} END`,
      image: sql<string | null>`CASE WHEN ${connections.requesterId} = ${userId} THEN ${addresseeUser.image} ELSE ${requesterUser.image} END`,
    })
    .from(connections)
    .innerJoin(requesterUser, eq(requesterUser.id, connections.requesterId))
    .innerJoin(addresseeUser, eq(addresseeUser.id, connections.addresseeId))
    .where(
      and(
        or(eq(connections.requesterId, userId), eq(connections.addresseeId, userId)),
        eq(connections.status, "accepted"),
      ),
    )
    .limit(limit);
}

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

export async function removeConnection(
  connectionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    const [connection] = await db()
      .select()
      .from(connections)
      .where(eq(connections.id, connectionId));

    if (!connection) {
      return { success: false, error: "Connection not found" };
    }

    if (connection.requesterId !== userId && connection.addresseeId !== userId) {
      return { success: false, error: "Not authorized" };
    }

    await db().delete(connections).where(eq(connections.id, connectionId));

    return { success: true };
  } catch (error) {
    console.error("removeConnection error:", error);
    return { success: false, error: "Failed to remove connection" };
  }
}
