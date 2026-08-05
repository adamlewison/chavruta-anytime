import { db } from "@/db";
import { conversations, messages, users } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

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
