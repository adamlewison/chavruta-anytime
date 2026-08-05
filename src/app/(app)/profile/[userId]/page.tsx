import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/auth";
import { getPublicProfileWithAvailability, listUserSubjectsWithHebrew } from "@/server/queries/profile";
import { getUserAvailabilityAndTimezone } from "@/server/queries/users";
import { getConnectionBetween } from "@/server/queries/connections";
import { listUserDmConversationIds, isConversationMember } from "@/server/queries/messages";
import { listChavrutaSessions } from "@/server/queries/sessions";
import { expandToUtcWeek, overlap, getNextSundayUtc } from "@/domain/availability";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Heatmap } from "@/components/availability";
import { ConnectButton } from "@/components/matching/connect-button";
import { ProfileHeader } from "@/components/profile/profile-header";
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
    const viewedUserRow = await getPublicProfileWithAvailability(userId);

    if (!viewedUserRow) {
      notFound();
    }

    viewedUser = viewedUserRow;

    const subjectsData = await listUserSubjectsWithHebrew(userId);

    viewedUserSubjects = subjectsData;

    const currentUserRow = await getUserAvailabilityAndTimezone(session.user.id);

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
    const conn = await getConnectionBetween(session.user.id, userId);

    if (conn) {
      connectionId = conn.id;
      if (conn.status === "accepted") {
        connectionState = "accepted";

        // DM conversation + sessions in parallel
        const [myConvIds, sessionRows] = await Promise.all([
          listUserDmConversationIds(session.user.id),
          listChavrutaSessions(conn.id),
        ]);

        for (const cid of myConvIds) {
          const isMember = await isConversationMember(cid, userId);
          if (isMember) {
            conversationId = cid;
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
