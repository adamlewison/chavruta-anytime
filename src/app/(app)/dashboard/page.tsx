import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  learningSessions,
  sessionOccurrences,
  userSubjects,
  subjects,
  connections,
  chaburaMembers,
  chaburas,
  users,
} from "@/db/schema";
import { eq, and, gt, lt, or, inArray } from "drizzle-orm";
import { DateTime } from "luxon";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/brand/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { JoinButton } from "@/components/sessions/join-button";
import { Calendar, Users, BookOpen, Video } from "lucide-react";
import { getMatches } from "@/server/actions/match";

export const metadata: Metadata = {
  title: "Dashboard — ChavrutaAnytime",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (!session.user.onboardedAt) {
    redirect("/onboarding");
  }

  const userId = session.user.id;
  const userName = session.user.name?.split(" ")[0] || "friend";

  const now = DateTime.utc();
  const sevenDaysFromNow = now.plus({ days: 7 });

  let upcomingSessions: Array<{
    occurrenceId: string;
    sessionId: string;
    title: string | null;
    startsAt: Date;
    endsAt: Date;
    meetUrl: string | null;
    sessionMeetUrl: string | null;
  }> = [];

  let nextSession: (typeof upcomingSessions)[0] | null = null;

  let suggestedMatches: Awaited<ReturnType<typeof getMatches>> = [];

  let activeChaburas: Array<{
    id: string;
    slug: string | null;
    name: string | null;
    image: string | null;
    memberCount: number;
  }> = [];

  try {
    // Get accepted connection IDs for this user
    const userConnections = await db()
      .select({ id: connections.id })
      .from(connections)
      .where(
        and(
          or(
            eq(connections.requesterId, userId),
            eq(connections.addresseeId, userId),
          ),
          eq(connections.status, "accepted"),
        ),
      );
    const connIds = userConnections.map((c) => c.id);

    // Get chabura IDs for this user (active member or rosh)
    const userChaburaRows = await db()
      .select({ chaburaId: chaburaMembers.chaburaId })
      .from(chaburaMembers)
      .where(
        and(
          eq(chaburaMembers.userId, userId),
          or(
            eq(chaburaMembers.role, "member"),
            eq(chaburaMembers.role, "rosh"),
          ),
        ),
      );
    const chaburaIds = userChaburaRows.map((c) => c.chaburaId);

    const sessionFilter = or(
      eq(learningSessions.createdById, userId),
      connIds.length > 0
        ? inArray(learningSessions.chavrutaPairId, connIds)
        : undefined,
      chaburaIds.length > 0
        ? inArray(learningSessions.chaburaId, chaburaIds)
        : undefined,
    );

    const occurrences = await db()
      .select({
        occurrenceId: sessionOccurrences.id,
        sessionId: sessionOccurrences.sessionId,
        title: learningSessions.title,
        startsAt: sessionOccurrences.startsAt,
        endsAt: sessionOccurrences.endsAt,
        meetUrl: sessionOccurrences.meetUrl,
        sessionMeetUrl: learningSessions.meetUrl,
      })
      .from(sessionOccurrences)
      .innerJoin(
        learningSessions,
        eq(sessionOccurrences.sessionId, learningSessions.id),
      )
      .where(
        and(
          sessionFilter,
          eq(sessionOccurrences.status, "scheduled"),
          gt(sessionOccurrences.startsAt, now.toJSDate()),
          lt(sessionOccurrences.startsAt, sevenDaysFromNow.toJSDate()),
        ),
      )
      .orderBy(sessionOccurrences.startsAt)
      .limit(8);

    upcomingSessions = occurrences;

    // Next session = first occurrence (may be within join window)
    if (upcomingSessions.length > 0) {
      nextSession = upcomingSessions[0];
    } else {
      // Check if there's a session happening right now (started within the last 30 min)
      const thirtyMinAgo = now.minus({ minutes: 30 });
      const [ongoingOcc] = await db()
        .select({
          occurrenceId: sessionOccurrences.id,
          sessionId: sessionOccurrences.sessionId,
          title: learningSessions.title,
          startsAt: sessionOccurrences.startsAt,
          endsAt: sessionOccurrences.endsAt,
          meetUrl: sessionOccurrences.meetUrl,
          sessionMeetUrl: learningSessions.meetUrl,
        })
        .from(sessionOccurrences)
        .innerJoin(
          learningSessions,
          eq(sessionOccurrences.sessionId, learningSessions.id),
        )
        .where(
          and(
            sessionFilter,
            eq(sessionOccurrences.status, "scheduled"),
            gt(sessionOccurrences.startsAt, thirtyMinAgo.toJSDate()),
            lt(sessionOccurrences.startsAt, now.toJSDate()),
          ),
        )
        .orderBy(sessionOccurrences.startsAt)
        .limit(1);
      if (ongoingOcc) nextSession = ongoingOcc;
    }

    // Active chaburas
    if (chaburaIds.length > 0) {
      const chaburaRows = await db()
        .select({
          id: chaburas.id,
          slug: chaburas.slug,
          name: chaburas.name,
          image: chaburas.image,
        })
        .from(chaburas)
        .where(inArray(chaburas.id, chaburaIds))
        .limit(4);

      // Count members per chabura
      activeChaburas = await Promise.all(
        chaburaRows.map(async (ch) => {
          const members = await db()
            .select({ userId: chaburaMembers.userId })
            .from(chaburaMembers)
            .where(
              and(
                eq(chaburaMembers.chaburaId, ch.id),
                or(
                  eq(chaburaMembers.role, "member"),
                  eq(chaburaMembers.role, "rosh"),
                ),
              ),
            );
          return { ...ch, memberCount: members.length };
        }),
      );
    }

    // Suggested matches (top 3)
    suggestedMatches = await getMatches(3);
  } catch (error) {
    console.error("Dashboard query error:", error);
  }

  const nextStartsAt = nextSession
    ? DateTime.fromJSDate(nextSession.startsAt, { zone: "utc" })
    : null;
  const nextEndsAt = nextSession
    ? DateTime.fromJSDate(nextSession.endsAt, { zone: "utc" })
    : null;
  const minutesUntilNext = nextStartsAt ? nextStartsAt.diff(now, "minutes").minutes : null;

  // Greeting based on time of day (UTC; good enough for a greeting)
  const hour = now.hour;
  const greeting =
    hour < 12
      ? "Boker tov"
      : hour < 18
        ? "Shalom"
        : "Erev tov";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-8">
      <h1 className="text-2xl font-bold text-foreground">
        {greeting}, {userName}.
      </h1>

      {/* Next session card */}
      {nextSession && nextStartsAt && nextEndsAt && (
        <section>
          <Card className="border-accent/30 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {nextSession.title ?? "Learning Session"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {minutesUntilNext !== null && minutesUntilNext > 0
                      ? minutesUntilNext < 60
                        ? `In ${Math.round(minutesUntilNext)} minutes`
                        : minutesUntilNext < 1440
                          ? `Tomorrow at ${nextStartsAt.toLocal().toFormat("h:mm a")}`
                          : nextStartsAt.toLocal().toFormat("EEE, MMM d · h:mm a")
                      : "Starting now"}
                  </p>
                </div>
                <Video className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              </div>
              {(nextSession.meetUrl ?? nextSession.sessionMeetUrl) && (
                <JoinButton
                  meetUrl={
                    (nextSession.meetUrl ?? nextSession.sessionMeetUrl)!
                  }
                  startsAt={nextSession.startsAt.toISOString()}
                  endsAt={nextSession.endsAt.toISOString()}
                  className="w-full"
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                asChild
              >
                <Link
                  href={`/sessions/${nextSession.sessionId}/o/${nextSession.occurrenceId}`}
                >
                  View details
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Upcoming this week */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Upcoming This Week
          </h2>
        </div>
        {upcomingSessions.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {upcomingSessions.map((occ) => (
              <Link
                key={occ.occurrenceId}
                href={`/sessions/${occ.sessionId}/o/${occ.occurrenceId}`}
                className="block min-w-[200px] flex-shrink-0"
              >
                <Card className="hover:border-accent/50 transition-colors h-full">
                  <CardContent className="p-4 space-y-2">
                    <p className="font-medium text-sm line-clamp-2">
                      {occ.title ?? "Learning Session"}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {DateTime.fromJSDate(occ.startsAt)
                        .toLocal()
                        .toFormat("EEE, MMM d")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {DateTime.fromJSDate(occ.startsAt)
                        .toLocal()
                        .toFormat("h:mm a")}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            heading="No sessions this week"
            description="Schedule a learning session with a chavruta or chabura."
            action={{ label: "Find a Chavruta", href: "/find" }}
            letter="ל"
          />
        )}
      </section>

      {/* Suggested chavrutas */}
      {suggestedMatches.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Suggested Chavrutas
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/find">See all</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {suggestedMatches.map((match) => {
              const initials =
                match.user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) ?? "?";
              return (
                <Link
                  key={match.user.id}
                  href={`/find/${match.user.id}`}
                  className="block"
                >
                  <Card className="hover:border-accent/50 transition-colors">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={match.user.image ?? undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {match.user.name ?? "Learner"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {match.highlights.sharedSubjects
                            .slice(0, 2)
                            .map((s) => s.name)
                            .join(", ")}
                          {match.highlights.exactHoursPerWeek > 0
                            ? ` · ${match.highlights.exactHoursPerWeek}h/wk`
                            : ""}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {Array.from({
                          length:
                            match.score >= 80 ? 3 : match.score >= 60 ? 2 : 1,
                        }).map((_, i) => (
                          <span
                            key={i}
                            className="h-2 w-2 rounded-full bg-accent inline-block"
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Active chaburas */}
      {activeChaburas.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              My Chaburas
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/chaburas">See all</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {activeChaburas.map((ch) => (
              <Link
                key={ch.id}
                href={`/chaburas/${ch.slug ?? ch.id}`}
                className="block"
              >
                <Card className="hover:border-accent/50 transition-colors">
                  <CardContent className="p-4 space-y-1.5">
                    <p className="font-medium text-sm line-clamp-2">
                      {ch.name ?? "Chabura"}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {ch.memberCount} member{ch.memberCount !== 1 ? "s" : ""}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* No sessions + no matches = new user CTA */}
      {upcomingSessions.length === 0 &&
        suggestedMatches.length === 0 &&
        activeChaburas.length === 0 && (
          <Card className="border-accent/20 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-6 text-center space-y-4 relative overflow-hidden">
              <span className="absolute inset-0 flex items-center justify-center text-[8rem] text-foreground/5 select-none pointer-events-none">
                ב
              </span>
              <div className="relative space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  You haven&apos;t found a chavruta yet — let&apos;s fix that.
                </h3>
                <p className="text-sm text-muted-foreground">
                  Every chavruta starts somewhere. Find a learning partner
                  today.
                </p>
              </div>
              <Button asChild className="relative gap-2 bg-accent text-white hover:bg-accent/90">
                <Link href="/find">
                  <BookOpen className="h-4 w-4" />
                  Find a Chavruta
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
