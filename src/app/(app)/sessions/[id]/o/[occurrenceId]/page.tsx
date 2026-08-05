import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/auth";
import { db } from "@/db";
import { sessionOccurrences, learningSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { Button } from "@/components/ui/button";
import { LiveKitJoinButton } from "@/components/sessions/livekit-join-button";
import { OccurrenceActions } from "./occurrence-actions";
import { Calendar, Clock, ChevronLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; occurrenceId: string }>;
}): Promise<Metadata> {
  const { occurrenceId } = await params;
  const [row] = await db()
    .select({ title: learningSessions.title })
    .from(sessionOccurrences)
    .innerJoin(learningSessions, eq(sessionOccurrences.sessionId, learningSessions.id))
    .where(eq(sessionOccurrences.id, occurrenceId));
  return { title: row?.title ?? "Session Occurrence" };
}

export default async function OccurrenceDetailPage({
  params,
}: {
  params: Promise<{ id: string; occurrenceId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!session.user.onboardedAt) redirect("/onboarding");

  const { id, occurrenceId } = await params;

  let occ: {
    id: string;
    sessionId: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
    meetUrl: string | null;
    notes: string | null;
    title: string | null;
    sessionMeetUrl: string | null;
    sessionTimezone: string | null;
    createdById: string;
  } | null = null;

  try {
    const [row] = await db()
      .select({
        id: sessionOccurrences.id,
        sessionId: sessionOccurrences.sessionId,
        startsAt: sessionOccurrences.startsAt,
        endsAt: sessionOccurrences.endsAt,
        status: sessionOccurrences.status,
        meetUrl: sessionOccurrences.meetUrl,
        notes: sessionOccurrences.notes,
        title: learningSessions.title,
        sessionMeetUrl: learningSessions.meetUrl,
        sessionTimezone: learningSessions.timezone,
        createdById: learningSessions.createdById,
      })
      .from(sessionOccurrences)
      .innerJoin(
        learningSessions,
        eq(sessionOccurrences.sessionId, learningSessions.id),
      )
      .where(eq(sessionOccurrences.id, occurrenceId));

    if (!row || row.sessionId !== id) notFound();
    occ = row;
  } catch (err) {
    console.error("Occurrence load error:", err);
    notFound();
  }

  if (!occ) notFound();

  const tz = occ.sessionTimezone ?? "UTC";
  const startsLocal = DateTime.fromJSDate(occ.startsAt, {
    zone: "utc",
  }).setZone(tz);
  const endsLocal = DateTime.fromJSDate(occ.endsAt, { zone: "utc" }).setZone(
    tz,
  );
  const startsViewer = DateTime.fromJSDate(occ.startsAt, {
    zone: "utc",
  }).toLocal();

  const statusColors: Record<string, string> = {
    scheduled: "bg-success/10 text-success",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive",
    missed: "bg-warning/10 text-warning",
  };

  const isOwner = occ.createdById === session.user.id;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6 pb-24">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 -ml-2">
          <Link href={`/sessions/${id}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {occ.title ?? "Session Occurrence"}
          </h1>

          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[occ.status] ?? ""}`}
          >
            {occ.status}
          </span>
        </div>
      </div>

      {/* Date/time in viewer's timezone, original TZ below */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          {startsViewer.toFormat("EEEE, MMMM d, yyyy")}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          {startsViewer.toFormat("h:mm a")}
          {" – "}
          {startsViewer
            .plus({ minutes: endsLocal.diff(startsLocal, "minutes").minutes })
            .toFormat("h:mm a")}
        </div>
        {tz !== startsViewer.zoneName && (
          <p className="text-xs text-muted-foreground/60 ml-6">
            {startsLocal.toFormat("h:mm a")} – {endsLocal.toFormat("h:mm a")}{" "}
            {tz}
          </p>
        )}
        <OccurrenceActions
          occurrenceId={occurrenceId}
          sessionId={id}
          isOwner={isOwner}
          status={
            occ.status as "scheduled" | "cancelled" | "completed" | "missed"
          }
          startsAt={occ.startsAt.toISOString()}
          timezone={tz}
          durationMin={Math.round(
            endsLocal.diff(startsLocal, "minutes").minutes,
          )}
        />
      </div>

      {/* Join button (client, handles time window) */}
      {occ.status === "scheduled" && (
        <LiveKitJoinButton
          occurrenceId={occurrenceId}
          startsAt={occ.startsAt.toISOString()}
          endsAt={occ.endsAt.toISOString()}
          className="w-full"
        />
      )}
    </div>
  );
}
