import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  users,
  userSubjects,
  subjects,
  connections,
  conversationMembers,
  conversations,
} from "@/db/schema";
import { eq, and, or, ne, asc } from "drizzle-orm";
import { expandToUtcWeek, overlap, getNextSundayUtc } from "@/domain/availability";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Heatmap } from "@/components/availability";
import { ConnectButton } from "@/components/matching/connect-button";
import { ProfileHeader } from "@/components/profile/profile-header";
import { learningSessions } from "@/db/schema";
import { SessionsTable } from "@/components/sessions/sessions-table";
import { BookOpen, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "User Profile — ChavrutaAnytime",
};

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (!session.user.onboardedAt) {
    redirect("/onboarding");
  }

  const { userId } = await params;

  if (userId === session.user.id) {
    redirect("/profile");
  }

  let viewedUser: {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    country: string | null;
    timezone: string | null;
    languages: string[] | null;
    availability: Buffer | null;
  } | null = null;

  let viewedUserSubjects: Array<{
    name: string;
    hebrewName: string | null;
  }> = [];

  let currentUser: {
    availability: Buffer | null;
    timezone: string | null;
  } | null = null;

  let overlapData: {
    exactHours: number;
    nearHours: number;
    strictMask: Uint8Array;
    nearMask: Uint8Array;
  } | null = null;

  let connectionState:
    | "none"
    | "pending_sent"
    | "pending_received"
    | "accepted" = "none";
  let connectionId: string | undefined;
  let conversationId: string | undefined;

  let sharedSessions: Array<{
    id: string;
    title: string | null;
    status: string;
    createdById: string;
    rrule: string | null;
    dtstart: Date | null;
    durationMin: number | null;
    timezone: string | null;
  }> = [];

  try {
    const [viewedUserRow] = await db()
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
        bio: users.bio,
        country: users.country,
        timezone: users.timezone,
        languages: users.languages,
        availability: users.availability,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!viewedUserRow) {
      notFound();
    }

    viewedUser = viewedUserRow;

    const subjectsData = await db()
      .select({
        name: subjects.name,
        hebrewName: subjects.hebrewName,
      })
      .from(userSubjects)
      .innerJoin(subjects, eq(userSubjects.subjectId, subjects.id))
      .where(eq(userSubjects.userId, userId));

    viewedUserSubjects = subjectsData;

    const [currentUserRow] = await db()
      .select({
        availability: users.availability,
        timezone: users.timezone,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    currentUser = currentUserRow || null;

    if (
      currentUser?.availability &&
      currentUser?.timezone &&
      viewedUser.availability &&
      viewedUser.timezone
    ) {
      const weekStart = getNextSundayUtc();
      const currentUtc = expandToUtcWeek(
        new Uint8Array(currentUser.availability),
        currentUser.timezone,
        weekStart,
      );
      const viewedUtc = expandToUtcWeek(
        new Uint8Array(viewedUser.availability),
        viewedUser.timezone,
        weekStart,
      );
      overlapData = overlap(currentUtc, viewedUtc);
    }

    // Look up connection state
    const [conn] = await db()
      .select()
      .from(connections)
      .where(
        or(
          and(
            eq(connections.requesterId, session.user.id),
            eq(connections.addresseeId, userId),
          ),
          and(
            eq(connections.requesterId, userId),
            eq(connections.addresseeId, session.user.id),
          ),
        ),
      );

    if (conn) {
      connectionId = conn.id;
      if (conn.status === "accepted") {
        connectionState = "accepted";

        // DM conversation + sessions in parallel
        const [myMemberships, sessionRows] = await Promise.all([
          db()
            .select({ conversationId: conversationMembers.conversationId })
            .from(conversationMembers)
            .innerJoin(
              conversations,
              and(
                eq(conversations.id, conversationMembers.conversationId),
                eq(conversations.type, "dm"),
              ),
            )
            .where(eq(conversationMembers.userId, session.user.id)),
          db()
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
            .where(
              and(
                eq(learningSessions.chavrutaPairId, conn.id),
                ne(learningSessions.status, "cancelled"),
              ),
            )
            .orderBy(asc(learningSessions.createdAt)),
        ]);

        for (const m of myMemberships) {
          const [other] = await db()
            .select()
            .from(conversationMembers)
            .where(
              and(
                eq(conversationMembers.conversationId, m.conversationId),
                eq(conversationMembers.userId, userId),
              ),
            );
          if (other) {
            conversationId = m.conversationId;
            break;
          }
        }

        if (sessionRows.length > 0) {
          sharedSessions = sessionRows;
        }
      } else if (conn.status === "pending") {
        connectionState =
          conn.requesterId === session.user.id
            ? "pending_sent"
            : "pending_received";
      }
    }
  } catch (error) {
    console.error("User profile query error:", error);
    notFound();
  }

  if (!viewedUser) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <ProfileHeader
        name={viewedUser.name}
        image={viewedUser.image}
        bio={viewedUser.bio}
        country={viewedUser.country}
        languages={viewedUser.languages}
      />

      {/* Action buttons */}
      <ConnectButton
        userId={userId}
        userName={viewedUser.name}
        initialState={connectionState}
        connectionId={connectionId}
        conversationId={conversationId}
      />

      {/* Sessions Together — only shown to accepted connections */}
      {connectionState === "accepted" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Sessions Together
            </h2>
            <Button size="sm" asChild>
              <Link href={`/sessions/new?with=${connectionId}&type=chavruta&name=${encodeURIComponent(viewedUser.name ?? "")}`}>
                <Plus className="h-4 w-4 mr-1" />
                New Session
              </Link>
            </Button>
          </div>

          {sharedSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions yet.</p>
          ) : (
            <SessionsTable
              sessions={sharedSessions}
              currentUserId={session.user.id}
            />
          )}
        </section>
      )}

      {/* Subjects */}
      {viewedUserSubjects.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Learning Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {viewedUserSubjects.map((subject, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1.5">
                  <BookOpen className="h-3 w-3" />
                  {subject.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability Overlap */}
      {overlapData && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Availability Overlap
            </h2>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Exact overlap: </span>
                <span className="font-medium">
                  {overlapData.exactHours}h/week
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Close match: </span>
                <span className="font-medium">
                  {overlapData.nearHours}h/week
                </span>
              </div>
            </div>
            <Separator />
            <Heatmap
              strictMask={overlapData.strictMask}
              nearMask={overlapData.nearMask}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
