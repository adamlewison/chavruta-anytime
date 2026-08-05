import { db } from "@/db";
import { conversations, conversationMembers, messages, users } from "@/db/schema";
import { eq, and, ne, asc, desc } from "drizzle-orm";

/** The single conversation id backing a chabura's group chat, if any. */
export async function getChaburaConversationId(chaburaId: string) {
  const [row] = await db()
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.chaburaId, chaburaId));
  return row?.id ?? null;
}

/** All messages in a conversation, oldest first, with sender name. */
export async function listConversationMessages(conversationId: string) {
  return db()
    .select({
      id: messages.id,
      senderId: messages.senderId,
      senderName: users.name,
      body: messages.body,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));
}

/** Verifies the caller is a member of a conversation and returns its type/chabura. */
export async function getConversationMembership(conversationId: string, userId: string) {
  const [row] = await db()
    .select({
      conversationId: conversationMembers.conversationId,
      convType: conversations.type,
      chaburaId: conversations.chaburaId,
    })
    .from(conversationMembers)
    .innerJoin(conversations, eq(conversations.id, conversationMembers.conversationId))
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
      ),
    );
  return row ?? null;
}

/** The other member's user id in a DM conversation (excluding `userId`). */
export async function getOtherDmMember(conversationId: string, userId: string) {
  const [row] = await db()
    .select({ userId: conversationMembers.userId })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        ne(conversationMembers.userId, userId),
      ),
    );
  return row?.userId ?? null;
}

/** All of a user's conversation memberships, with the conversation's type/chabura/lastRead. */
export async function listUserConversationMemberships(userId: string) {
  return db()
    .select({
      conversationId: conversationMembers.conversationId,
      lastReadAt: conversationMembers.lastReadAt,
      convType: conversations.type,
      chaburaId: conversations.chaburaId,
    })
    .from(conversationMembers)
    .innerJoin(conversations, eq(conversations.id, conversationMembers.conversationId))
    .where(eq(conversationMembers.userId, userId));
}

/** The most recent message body/timestamp in a conversation, if any. */
export async function getConversationLatestMessage(conversationId: string) {
  const [row] = await db()
    .select({ body: messages.body, createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(1);
  return row ?? null;
}

/** Ids of DM conversations the user belongs to. */
export async function listUserDmConversationIds(userId: string) {
  const rows = await db()
    .select({ conversationId: conversationMembers.conversationId })
    .from(conversationMembers)
    .innerJoin(
      conversations,
      and(eq(conversations.id, conversationMembers.conversationId), eq(conversations.type, "dm")),
    )
    .where(eq(conversationMembers.userId, userId));
  return rows.map((m) => m.conversationId);
}

/** True when `userId` is a member of `conversationId`. */
export async function isConversationMember(conversationId: string, userId: string) {
  const [row] = await db()
    .select()
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
      ),
    );
  return !!row;
}
