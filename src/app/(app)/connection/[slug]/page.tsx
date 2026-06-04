import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  chaburas,
  chaburaMembers,
  users,
  subjects,
  learningSessions,
  sessionOccurrences,
  conversations,
  conversationMembers,
  messages,
} from "@/db/schema";
import { eq, and, gt, asc } from "drizzle-orm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { JoinButton } from "@/components/chaburas/join-button";
import { PendingMemberRow } from "@/components/chaburas/pending-member-row";
import { ChaburaGroupChat } from "@/components/chat/chabura-group-chat";
import { Users, BookOpen, Calendar, Globe, Lock, Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Chabura — ChavrutaAnytime",
};

type MembershipState = "none" | "pending" | "member" | "rosh";

function initialsOf(name: string | null): string {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

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

  let upcoming: Array<{
    id: string;
    title: string | null;
    startsAt: Date;
  }> = [];

  let conversationId: string | null = null;
  let chatMessages: Array<{
    id: string;
    senderId: string;
    body: string;
    createdAt: string;
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

    const now = new Date();
    upcoming = await db()
      .select({
        id: sessionOccurrences.id,
        title: learningSessions.title,
        startsAt: sessionOccurrences.startsAt,
      })
      .from(sessionOccurrences)
      .innerJoin(
        learningSessions,
        eq(sessionOccurrences.sessionId, learningSessions.id),
      )
      .where(
        and(
          eq(learningSessions.chaburaId, chabura.id),
          eq(sessionOccurrences.status, "scheduled"),
          gt(sessionOccurrences.startsAt, now),
        ),
      )
      .orderBy(asc(sessionOccurrences.startsAt))
      .limit(5);

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
            body: messages.body,
            createdAt: messages.createdAt,
          })
          .from(messages)
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
  const isRosh = membershipState === "rosh";
  const isMember = membershipState === "member" || isRosh;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6 pb-28">
      {/* Header */}
      <div className="space-y-3">
        {isRosh && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" asChild className="gap-1.5">
              <Link href={`/chaburas/${chabura.slug}/manage`}>
                <Settings className="h-4 w-4" /> Manage
              </Link>
            </Button>
          </div>
        )}
        <div className="flex items-start gap-4">
          {chabura.image ? (
            <Avatar className="h-16 w-16 rounded-xl">
              <AvatarImage src={chabura.image} alt={chabura.name} />
              <AvatarFallback className="rounded-xl text-xl">
                {initialsOf(chabura.name)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
              <BookOpen className="h-7 w-7 text-accent" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">
              {chabura.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {visibleMembers.length} member
                {visibleMembers.length !== 1 ? "s" : ""}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                {chabura.isPublic ? (
                  <>
                    <Globe className="h-4 w-4" /> Public
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Private
                  </>
                )}
              </span>
              {chabura.subjectName && (
                <>
                  <span>·</span>
                  <Badge variant="secondary">{chabura.subjectName}</Badge>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="about">
        <TabsList className="w-full">
          <TabsTrigger value="about" className="flex-1">
            About
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-1">
            Members
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex-1">
            Sessions
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex-1">
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-2">
              <h2 className="font-semibold text-foreground">
                Description
              </h2>
              {chabura.description ? (
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {chabura.description}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  No description yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-4 space-y-3">
          {visibleMembers.length > 0 ? (
            visibleMembers.map((m) => (
              <Link
                key={m.userId}
                href={`/profile/${m.userId}`}
                className="block"
              >
                <Card className="hover:border-accent/50 transition-colors">
                  <CardContent className="flex items-center gap-3 p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={m.image ?? undefined}
                        alt={m.name ?? "Member"}
                      />
                      <AvatarFallback className="text-sm">
                        {initialsOf(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.name || "Anonymous"}
                      </p>
                    </div>
                    {m.role === "rosh" && (
                      <Badge variant="secondary">Rosh</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              No members yet. Be the first to join!
            </p>
          )}

          {isRosh && pendingMembers.length > 0 && (
            <div className="pt-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Pending requests
              </h3>
              {pendingMembers.map((m) => (
                <PendingMemberRow
                  key={m.userId}
                  chaburaId={chabura.id}
                  userId={m.userId}
                  name={m.name}
                  image={m.image}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="mt-4 space-y-3">
          {upcoming.length > 0 ? (
            upcoming.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4 space-y-1">
                  <p className="text-sm font-medium">
                    {s.title || "Learning session"}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {s.startsAt.toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              No sessions scheduled yet.
            </p>
          )}
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          {conversationId ? (
            <ChaburaGroupChat
              conversationId={conversationId}
              currentUserId={currentUserId}
              initialMessages={chatMessages}
            />
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              {membershipState === "pending"
                ? "Your request is pending approval."
                : "Join this chabura to see the chat."}
            </p>
          )}
        </TabsContent>
      </Tabs>

      {/* Sticky Join Button */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3 md:bottom-0">
        <div className="mx-auto max-w-2xl">
          <JoinButton
            chaburaId={chabura.id}
            initialState={membershipState}
            isPublic={chabura.isPublic ?? true}
          />
        </div>
      </div>
    </div>
  );
}
