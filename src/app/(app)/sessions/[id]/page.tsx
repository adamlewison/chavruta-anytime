import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { learningSessions, sessionOccurrences, subjects, connections, users, chaburas } from "@/db/schema";
import { eq, and, gt, asc, or } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JoinButton } from "@/components/sessions/join-button";
import { OccurrenceCard } from "@/components/sessions/occurrence-card";
import { Calendar, Clock, ChevronLeft, Pause, Play, X } from "lucide-react";
import { rruleToText } from "@/lib/rrule";
import { pauseSession, resumeSession, cancelSession } from "@/server/actions/sessions";

export const metadata: Metadata = { title: "Session — ChavrutaAnytime" };

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!session.user.onboardedAt) redirect("/onboarding");

  const { id } = await params;

  let sessionData: {
    id: string;
    title: string | null;
    status: string;
    rrule: string | null;
    durationMin: number | null;
    timezone: string | null;
    subjectName: string | null;
    meetUrl: string | null;
    createdById: string;
    chavrutaPairId: string | null;
    chaburaId: string | null;
  } | null = null;

  let partnerName: string | null = null;
  let chaburaName: string | null = null;

  let occurrences: Array<{
    id: string;
    sessionId: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
    meetUrl: string | null;
  }> = [];

  try {
    const [row] = await db()
      .select({
        id: learningSessions.id,
        title: learningSessions.title,
        status: learningSessions.status,
        rrule: learningSessions.rrule,
        durationMin: learningSessions.durationMin,
        timezone: learningSessions.timezone,
        subjectName: subjects.name,
        meetUrl: learningSessions.meetUrl,
        createdById: learningSessions.createdById,
        chavrutaPairId: learningSessions.chavrutaPairId,
        chaburaId: learningSessions.chaburaId,
      })
      .from(learningSessions)
      .leftJoin(subjects, eq(learningSessions.subjectId, subjects.id))
      .where(eq(learningSessions.id, id));

    if (!row) notFound();
    sessionData = row;

    // Resolve partner name (chavruta) or chabura name
    if (row.chavrutaPairId) {
      const [conn] = await db()
        .select({ requesterId: connections.requesterId, addresseeId: connections.addresseeId })
        .from(connections)
        .where(eq(connections.id, row.chavrutaPairId));
      if (conn) {
        const partnerId = conn.requesterId === session.user.id ? conn.addresseeId : conn.requesterId;
        const [partner] = await db()
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, partnerId));
        partnerName = partner?.name ?? null;
      }
    } else if (row.chaburaId) {
      const [chab] = await db()
        .select({ name: chaburas.name })
        .from(chaburas)
        .where(eq(chaburas.id, row.chaburaId));
      chaburaName = chab?.name ?? null;
    }

    const now = new Date();
    occurrences = await db()
      .select({
        id: sessionOccurrences.id,
        sessionId: sessionOccurrences.sessionId,
        startsAt: sessionOccurrences.startsAt,
        endsAt: sessionOccurrences.endsAt,
        status: sessionOccurrences.status,
        meetUrl: sessionOccurrences.meetUrl,
      })
      .from(sessionOccurrences)
      .where(
        and(
          eq(sessionOccurrences.sessionId, id),
          gt(sessionOccurrences.startsAt, now),
        ),
      )
      .orderBy(asc(sessionOccurrences.startsAt))
      .limit(10);
  } catch (err) {
    console.error("Session load error:", err);
    notFound();
  }

  if (!sessionData) notFound();

  const isOwner = sessionData.createdById === session.user.id;
  const statusColors: Record<string, string> = {
    active: "bg-success/10 text-success",
    paused: "bg-warning/10 text-warning",
    cancelled: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 -ml-2">
          <Link href="/dashboard"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-foreground truncate">
            {sessionData.title ?? "Learning Session"}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {sessionData.subjectName && (
              <Badge variant="secondary">{sessionData.subjectName}</Badge>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[sessionData.status] ?? ""}`}>
              {sessionData.status}
            </span>
            {partnerName && (
              <span className="text-xs text-muted-foreground">with {partnerName}</span>
            )}
            {chaburaName && (
              <span className="text-xs text-muted-foreground">{chaburaName}</span>
            )}
          </div>
        </div>
      </div>

      {/* Schedule info */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-foreground">Schedule</h2>
          {sessionData.rrule && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="capitalize">{rruleToText(sessionData.rrule)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{sessionData.durationMin} minutes · {sessionData.timezone ?? "UTC"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming occurrences */}
      <div className="space-y-3">
        <h2 className="font-semibold text-foreground">Upcoming Sessions</h2>
        {occurrences.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p>
        ) : (
          occurrences.map((occ) => (
            <OccurrenceCard
              key={occ.id}
              id={occ.id}
              sessionId={occ.sessionId}
              startsAt={occ.startsAt.toISOString()}
              endsAt={occ.endsAt.toISOString()}
              status={occ.status as "scheduled" | "cancelled" | "completed" | "missed"}
              meetUrl={occ.meetUrl ?? sessionData!.meetUrl ?? ""}
              title={sessionData!.title ?? "Session"}
            />
          ))
        )}
      </div>

      {/* Owner actions */}
      {isOwner && sessionData.status !== "cancelled" && (
        <div className="flex flex-col gap-2">
          {sessionData.status === "active" && (
            <form action={async () => { "use server"; await pauseSession(id); }}>
              <Button variant="outline" className="w-full gap-2" type="submit">
                <Pause className="h-4 w-4" /> Pause Session
              </Button>
            </form>
          )}
          {sessionData.status === "paused" && (
            <form action={async () => { "use server"; await resumeSession(id); }}>
              <Button variant="outline" className="w-full gap-2 text-success" type="submit">
                <Play className="h-4 w-4" /> Resume Session
              </Button>
            </form>
          )}
          <form action={async () => { "use server"; await cancelSession(id); }}>
            <Button variant="outline" className="w-full gap-2 text-destructive" type="submit">
              <X className="h-4 w-4" /> Cancel Series
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
