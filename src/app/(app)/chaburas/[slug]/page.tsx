import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  chaburas,
  chaburaMembers,
  users,
  subjects,
  learningSessions,
  conversations,
  messages,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ChaburaDetailView } from "@/components/chaburas/chabura-detail-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [row] = await db()
    .select({ name: chaburas.name })
    .from(chaburas)
    .where(eq(chaburas.slug, slug));
  return {
    title: row ? `${row.name}` : "Chabura",
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
    const [row] = await db()
      .select({
        id: chaburas.id,
        slug: chaburas.slug,
        name: chaburas.name,
        description: chaburas.description,
        image: chaburas.image,
        isPublic: chaburas.isPublic,
        roshChaburaId: chaburas.roshChaburaId,
        subjectName: subjects.name,
        createdAt: chaburas.createdAt,
      })
      .from(chaburas)
      .leftJoin(learningSessions, eq(learningSessions.chaburaId, chaburas.id))
      .leftJoin(subjects, eq(subjects.id, learningSessions.subjectId))
      .where(eq(chaburas.slug, slug));

    if (!row) notFound();
    chabura = row;

    const memberRows = await db()
      .select({
        userId: chaburaMembers.userId,
        role: chaburaMembers.role,
        name: users.name,
        image: users.image,
        joinedAt: chaburaMembers.joinedAt,
      })
      .from(chaburaMembers)
      .innerJoin(users, eq(users.id, chaburaMembers.userId))
      .where(eq(chaburaMembers.chaburaId, chabura.id))
      .orderBy(asc(chaburaMembers.joinedAt));

    members = memberRows;

    const me = members.find((m) => m.userId === currentUserId);
    if (me) membershipState = me.role as MembershipState;

    // Load sessions for all visitors
    {
      manageSessions = await db()
        .select({
          id: learningSessions.id,
          title: learningSessions.title,
          status: learningSessions.status,
          createdById: learningSessions.createdById,
          rrule: learningSessions.rrule,
          dtstart: learningSessions.dtstart,
          durationMin: learningSessions.durationMin,
          timezone: learningSessions.timezone,
        })
        .from(learningSessions)
        .where(eq(learningSessions.chaburaId, chabura.id))
        .orderBy(asc(learningSessions.createdAt));
    }

    // Load conversation for chat tab (only if member/rosh)
    const myRole = members.find((m) => m.userId === currentUserId)?.role;
    if (myRole === "member" || myRole === "rosh") {
      const [conv] = await db()
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.chaburaId, chabura.id));

      if (conv) {
        conversationId = conv.id;
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
          .where(eq(messages.conversationId, conv.id))
          .orderBy(asc(messages.createdAt));

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
