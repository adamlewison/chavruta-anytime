import { db } from "@/db";
import { learningSessions, sessionOccurrences, subjects } from "@/db/schema";
import { eq, and, gt, asc } from "drizzle-orm";

/** Learning sessions belonging to a chabura, oldest created first. */
export async function listChaburaSessions(chaburaId: string) {
  return db()
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
    .where(eq(learningSessions.chaburaId, chaburaId))
    .orderBy(asc(learningSessions.createdAt));
}

/** A session occurrence's title, for <title> metadata. */
export async function getOccurrenceTitle(occurrenceId: string) {
  const [row] = await db()
    .select({ title: learningSessions.title })
    .from(sessionOccurrences)
    .innerJoin(learningSessions, eq(sessionOccurrences.sessionId, learningSessions.id))
    .where(eq(sessionOccurrences.id, occurrenceId));
  return row?.title ?? null;
}

/** A session occurrence joined to its parent session's title/meetUrl/timezone. */
export async function getOccurrenceDetail(occurrenceId: string) {
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
  return row ?? null;
}

/** A learning session's title, for <title> metadata. */
export async function getSessionTitle(sessionId: string) {
  const [row] = await db()
    .select({ title: learningSessions.title })
    .from(learningSessions)
    .where(eq(learningSessions.id, sessionId));
  return row?.title ?? null;
}

/** Learning session detail with its subject name, by id. */
export async function getSessionDetail(sessionId: string) {
  const [row] = await db()
    .select({
      id: learningSessions.id,
      title: learningSessions.title,
      status: learningSessions.status,
      rrule: learningSessions.rrule,
      dtstart: learningSessions.dtstart,
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
    .where(eq(learningSessions.id, sessionId));
  return row ?? null;
}

/** Up to 10 upcoming (future, started after `now`) occurrences of a session. */
export async function listUpcomingOccurrences(sessionId: string, now: Date) {
  return db()
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
        eq(sessionOccurrences.sessionId, sessionId),
        gt(sessionOccurrences.startsAt, now),
      ),
    )
    .orderBy(asc(sessionOccurrences.startsAt))
    .limit(10);
}
