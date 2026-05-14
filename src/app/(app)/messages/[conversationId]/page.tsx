import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { conversationMembers, messages, users } from "@/db/schema";
import { eq, and, ne, asc } from "drizzle-orm";
import { ChatThread } from "@/components/chat/chat-thread";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!session.user.onboardedAt) redirect("/onboarding");

  const { conversationId } = await params;
  const userId = session.user.id;

  // Verify membership
  try {
    const [membership] = await db()
      .select()
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId),
        ),
      );
    if (!membership) notFound();

    // Other participant
    const [otherMember] = await db()
      .select({ userId: conversationMembers.userId })
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          ne(conversationMembers.userId, userId),
        ),
      );

    const otherUser = otherMember
      ? await db()
          .select({ name: users.name, image: users.image })
          .from(users)
          .where(eq(users.id, otherMember.userId))
          .then((r) => r[0] ?? null)
      : null;

    // Fetch messages
    const msgs = await db()
      .select({
        id: messages.id,
        senderId: messages.senderId,
        body: messages.body,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    const serialised = msgs.map((m) => ({
      ...m,
      createdAt: (m.createdAt ?? new Date()).toISOString(),
    }));

    return (
      <ChatThread
        conversationId={conversationId}
        currentUserId={userId}
        otherUser={{ name: otherUser?.name ?? null, image: otherUser?.image ?? null }}
        initialMessages={serialised}
      />
    );
  } catch (err) {
    console.error("Conversation load error:", err);
    notFound();
  }
}
