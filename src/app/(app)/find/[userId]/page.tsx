import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, userSubjects, subjects, connections, conversationMembers, conversations } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { expandToUtcWeek, overlap, getNextSundayUtc } from "@/lib/availability";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Heatmap } from "@/components/availability";
import { ConnectButton } from "@/components/matching/connect-button";
import { ArrowLeft, MapPin, Globe, BookOpen } from "lucide-react";
import { languageName } from "@/lib/languages";

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

  let connectionState: "none" | "pending_sent" | "pending_received" | "accepted" = "none";
  let connectionId: string | undefined;
  let conversationId: string | undefined;

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
          and(eq(connections.requesterId, session.user.id), eq(connections.addresseeId, userId)),
          and(eq(connections.requesterId, userId), eq(connections.addresseeId, session.user.id)),
        ),
      );

    if (conn) {
      connectionId = conn.id;
      if (conn.status === "accepted") {
        connectionState = "accepted";
        // Find shared DM conversation
        const myMemberships = await db()
          .select({ conversationId: conversationMembers.conversationId })
          .from(conversationMembers)
          .innerJoin(conversations, and(
            eq(conversations.id, conversationMembers.conversationId),
            eq(conversations.type, "dm"),
          ))
          .where(eq(conversationMembers.userId, session.user.id));

        for (const m of myMemberships) {
          const [other] = await db()
            .select()
            .from(conversationMembers)
            .where(and(
              eq(conversationMembers.conversationId, m.conversationId),
              eq(conversationMembers.userId, userId),
            ));
          if (other) { conversationId = m.conversationId; break; }
        }
      } else if (conn.status === "pending") {
        connectionState = conn.requesterId === session.user.id ? "pending_sent" : "pending_received";
      }
    }
  } catch (error) {
    console.error("User profile query error:", error);
    notFound();
  }

  if (!viewedUser) {
    notFound();
  }

  const initials =
    viewedUser.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6 pb-24">
      {/* Back Button */}
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/find">
          <ArrowLeft className="h-4 w-4" />
          Back to matches
        </Link>
      </Button>

      {/* Profile Header */}
      <div className="flex flex-col items-center text-center space-y-3">
        <Avatar className="h-24 w-24">
          <AvatarImage
            src={viewedUser.image || undefined}
            alt={viewedUser.name || "User"}
          />
          <AvatarFallback className="text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            {viewedUser.name || "Anonymous"}
          </h1>
          {viewedUser.bio && (
            <p className="text-sm text-muted-foreground max-w-md">
              {viewedUser.bio}
            </p>
          )}
        </div>
      </div>

      {/* Location & Languages */}
      {(viewedUser.country || viewedUser.timezone || viewedUser.languages) && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Location & Languages
            </h2>
            <div className="space-y-2 text-sm">
              {viewedUser.country && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{viewedUser.country}</span>
                </div>
              )}
              {viewedUser.timezone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>{viewedUser.timezone}</span>
                </div>
              )}
              {viewedUser.languages && viewedUser.languages.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">🗣️</span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewedUser.languages.map((lang, idx) => (
                      <Badge key={idx} variant="secondary">
                        {languageName(lang)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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

      {/* Sticky Connect Button */}
      <ConnectButton
        userId={userId}
        userName={viewedUser.name}
        initialState={connectionState}
        connectionId={connectionId}
        conversationId={conversationId}
      />
    </div>
  );
}
