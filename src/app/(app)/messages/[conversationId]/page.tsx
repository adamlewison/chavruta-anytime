import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { conversations, conversationMembers, messages, users, chaburas } from "@/db/schema";
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

  try {
    // Verify membership and get conversation type
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

    if (!row) notFound();

    let displayName: string | null = null;
    let displayImage: string | null = null;

    let profileHref: string | null = null;

    if (row.convType === "dm") {
      const [otherMember] = await db()
        .select({ userId: conversationMembers.userId })
        .from(conversationMembers)
        .where(
          and(
            eq(conversationMembers.conversationId, conversationId),
            ne(conversationMembers.userId, userId),
          ),
        );

      if (otherMember) {
        const [otherUser] = await db()
          .select({ name: users.name, image: users.image })
          .from(users)
          .where(eq(users.id, otherMember.userId));
        displayName = otherUser?.name ?? null;
        displayImage = otherUser?.image ?? null;
        profileHref = `/profile/${otherMember.userId}`;
      }
    } else if (row.chaburaId) {
      const [chabura] = await db()
        .select({ name: chaburas.name, image: chaburas.image, slug: chaburas.slug })
        .from(chaburas)
        .where(eq(chaburas.id, row.chaburaId));
      displayName = chabura?.name ?? null;
      displayImage = chabura?.image ?? null;
      profileHref = chabura ? `/chaburas/${chabura.slug}` : null;
    }

    const msgs = await db()
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

    const serialised = msgs.map((m) => ({
      ...m,
      createdAt: (m.createdAt ?? new Date()).toISOString(),
    }));

    return (
      <ChatThread
        conversationId={conversationId}
        currentUserId={userId}
        otherUser={{ name: displayName, image: displayImage, profileHref }}
        isChabura={row.convType === "chabura"}
        initialMessages={serialised}
      />
    );
  } catch (err) {
    console.error("Conversation load error:", err);
    notFound();
  }
}
