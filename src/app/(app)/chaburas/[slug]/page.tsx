import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/server/auth";
import {
  getChaburaName,
  getChaburaDetailBySlug,
  getChaburaMembers,
} from "@/server/queries/chaburas";
import { listChaburaSessions } from "@/server/queries/sessions";
import { getChaburaConversationId, listConversationMessages } from "@/server/queries/messages";
import { ChaburaDetailView } from "@/components/chaburas/chabura-detail-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = await getChaburaName(slug);
  return {
    title: name ? `${name}` : "Chabura",
  };
}

type MembershipState = "none" | "pending" | "member" | "rosh";

export default async function ChaburaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  if (!session.user.onboardedAt) {
    redirect("/onboarding");
  }

  const { slug } = await params;
  const currentUserId = session.user.id;

  let chabura: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    image: string | null;
    isPublic: boolean | null;
    roshChaburaId: string | null;
    subjectName: string | null;
    createdAt: Date | null;
  } | null = null;

  let members: Array<{
    userId: string;
    role: "rosh" | "member" | "pending";
    name: string | null;
    image: string | null;
    joinedAt: Date | null;
  }> = [];

  let conversationId: string | null = null;
  let chatMessages: Array<{
    id: string;
    senderId: string;
    senderName: string | null;
    body: string;
    createdAt: string;
  }> = [];

  let manageSessions: Array<{
    id: string;
    title: string | null;
    status: string;
    createdById: string;
    rrule: string | null;
    dtstart: Date | null;
    durationMin: number | null;
    timezone: string | null;
  }> = [];

  let membershipState: MembershipState = "none";

  try {
    const row = await getChaburaDetailBySlug(slug);

    if (!row) notFound();
    chabura = row;

    const memberRows = await getChaburaMembers(chabura.id);

    members = memberRows;

    const me = members.find((m) => m.userId === currentUserId);
    if (me) membershipState = me.role as MembershipState;

    // Load sessions for all visitors
    {
      manageSessions = await listChaburaSessions(chabura.id);
    }

    // Load conversation for chat tab (only if member/rosh)
    const myRole = members.find((m) => m.userId === currentUserId)?.role;
    if (myRole === "member" || myRole === "rosh") {
      const convId = await getChaburaConversationId(chabura.id);

      if (convId) {
        conversationId = convId;
        const msgs = await listConversationMessages(convId);

        chatMessages = msgs.map((m) => ({
          ...m,
          createdAt: (m.createdAt ?? new Date()).toISOString(),
        }));
      }
    }
  } catch (error) {
    console.error("Chabura detail load error:", error);
    notFound();
  }

  if (!chabura) notFound();

  const visibleMembers = members.filter((m) => m.role !== "pending");
  const pendingMembers = members.filter((m) => m.role === "pending");

  return (
    <ChaburaDetailView
      chabura={chabura}
      visibleMembers={visibleMembers}
      pendingMembers={pendingMembers}
      conversationId={conversationId}
      chatMessages={chatMessages}
      manageSessions={manageSessions}
      membershipState={membershipState}
      currentUserId={currentUserId}
    />
  );
}
