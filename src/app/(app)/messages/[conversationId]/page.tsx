import { redirect, notFound } from "next/navigation";
import { auth } from "@/server/auth";
import {
  getConversationMembership,
  getOtherDmMember,
  listConversationMessages,
} from "@/server/queries/messages";
import { getUserHeader } from "@/server/queries/users";
import { getChaburaNameImageSlug } from "@/server/queries/chaburas";
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

  let chatThreadProps: {
    conversationId: string;
    currentUserId: string;
    otherUser: { name: string | null; image: string | null; profileHref: string | null };
    isChabura: boolean;
    initialMessages: {
      id: string;
      senderId: string;
      senderName: string | null;
      body: string;
      createdAt: string;
    }[];
  };

  try {
    // Verify membership and get conversation type
    const row = await getConversationMembership(conversationId, userId);

    if (!row) notFound();

    let displayName: string | null = null;
    let displayImage: string | null = null;

    let profileHref: string | null = null;

    if (row.convType === "dm") {
      const otherMemberId = await getOtherDmMember(conversationId, userId);

      if (otherMemberId) {
        const otherUser = await getUserHeader(otherMemberId);
        displayName = otherUser?.name ?? null;
        displayImage = otherUser?.image ?? null;
        profileHref = `/profile/${otherMemberId}`;
      }
    } else if (row.chaburaId) {
      const chabura = await getChaburaNameImageSlug(row.chaburaId);
      displayName = chabura?.name ?? null;
      displayImage = chabura?.image ?? null;
      profileHref = chabura ? `/chaburas/${chabura.slug}` : null;
    }

    const msgs = await listConversationMessages(conversationId);

    const serialised = msgs.map((m) => ({
      ...m,
      createdAt: (m.createdAt ?? new Date()).toISOString(),
    }));

    chatThreadProps = {
      conversationId,
      currentUserId: userId,
      otherUser: { name: displayName, image: displayImage, profileHref },
      isChabura: row.convType === "chabura",
      initialMessages: serialised,
    };
  } catch (err) {
    console.error("Conversation load error:", err);
    notFound();
  }

  return <ChatThread {...chatThreadProps} />;
}
