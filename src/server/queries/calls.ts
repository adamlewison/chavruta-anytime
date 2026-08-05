import { db } from "@/db";
import { calls, sessionOccurrences, learningSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/** A session occurrence's linked call id, or null if the occurrence itself doesn't exist. */
export async function getOccurrenceCallId(occurrenceId: string) {
  const [occurrence] = await db()
    .select({ callId: sessionOccurrences.callId })
    .from(sessionOccurrences)
    .where(eq(sessionOccurrences.id, occurrenceId))
    .limit(1);
  return occurrence ?? null;
}

/** The occurrence's id/callId/sessionId, for starting or joining a call. */
export async function getOccurrenceForCallStart(occurrenceId: string) {
  const [occurrence] = await db()
    .select({
      id: sessionOccurrences.id,
      callId: sessionOccurrences.callId,
      sessionId: sessionOccurrences.sessionId,
    })
    .from(sessionOccurrences)
    .where(eq(sessionOccurrences.id, occurrenceId))
    .limit(1);
  return occurrence ?? null;
}

/** A learning session's chaburaId/createdById, for call access checks. */
export async function getSessionAccessInfo(sessionId: string) {
  const [ls] = await db()
    .select({ chaburaId: learningSessions.chaburaId, createdById: learningSessions.createdById })
    .from(learningSessions)
    .where(eq(learningSessions.id, sessionId))
    .limit(1);
  return ls ?? null;
}

/** The active call for a given call id, if it is still active. */
export async function getActiveCall(callId: string) {
  const [call] = await db()
    .select()
    .from(calls)
    .where(and(eq(calls.id, callId), eq(calls.status, "active")))
    .limit(1);
  return call ?? null;
}

/** A call by id, regardless of status. */
export async function getCallById(callId: string) {
  const [call] = await db()
    .select()
    .from(calls)
    .where(eq(calls.id, callId));
  return call ?? null;
}
