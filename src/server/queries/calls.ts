import { db } from "@/db";
import { calls, sessionOccurrences, learningSessions, connections, chaburas, users } from "@/db/schema";
import { eq, and, gt, or, inArray, asc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

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

/**
 * Up to 10 upcoming scheduled occurrences the user can start a test call for
 * (sessions they created, or share via an accepted connection / chabura),
 * with the linked call's status if one exists.
 */
export async function listTestCallOccurrences(
  userId: string,
  connIds: string[],
  chaburaIds: string[],
  now: Date,
) {
  const sessionFilter = or(
    eq(learningSessions.createdById, userId),
    connIds.length > 0 ? inArray(learningSessions.chavrutaPairId, connIds) : undefined,
    chaburaIds.length > 0 ? inArray(learningSessions.chaburaId, chaburaIds) : undefined,
  );

  return db()
    .select({
      occurrenceId: sessionOccurrences.id,
      sessionId: sessionOccurrences.sessionId,
      title: learningSessions.title,
      startsAt: sessionOccurrences.startsAt,
      endsAt: sessionOccurrences.endsAt,
      callId: sessionOccurrences.callId,
      callStatus: calls.status,
    })
    .from(sessionOccurrences)
    .innerJoin(learningSessions, eq(sessionOccurrences.sessionId, learningSessions.id))
    .leftJoin(calls, eq(calls.id, sessionOccurrences.callId))
    .where(
      and(
        sessionFilter,
        eq(sessionOccurrences.status, "scheduled"),
        gt(sessionOccurrences.startsAt, now),
      ),
    )
    .orderBy(asc(sessionOccurrences.startsAt))
    .limit(10);
}

/**
 * The occurrence + parent session + partner/chabura display info needed to
 * render the call page, joined in one query (aliased so both the chavruta
 * partner and chabura branches resolve in the same row).
 */
export async function getCallPageDetail(occurrenceId: string, userId: string) {
  const reqUser = alias(users, "req_user");
  const addrUser = alias(users, "addr_user");
  const connAlias = alias(connections, "conn");
  const chaburasAlias = alias(chaburas, "chab");

  const [row] = await db()
    .select({
      occurrenceId: sessionOccurrences.id,
      sessionId: sessionOccurrences.sessionId,
      callId: sessionOccurrences.callId,
      startsAt: sessionOccurrences.startsAt,
      endsAt: sessionOccurrences.endsAt,
      status: sessionOccurrences.status,
      title: learningSessions.title,
      type: learningSessions.type,
      chaburaId: learningSessions.chaburaId,
      chavrutaPairId: learningSessions.chavrutaPairId,
      createdById: learningSessions.createdById,
      // partner or chabura display info
      partnerName: sql<string | null>`
        CASE
          WHEN ${learningSessions.chaburaId} IS NOT NULL THEN ${chaburasAlias.name}
          WHEN ${connAlias.id} IS NOT NULL THEN
            CASE WHEN ${connAlias.requesterId} = ${userId}
              THEN ${addrUser.name}
              ELSE ${reqUser.name}
            END
          ELSE NULL
        END`,
      partnerImage: sql<string | null>`
        CASE
          WHEN ${learningSessions.chaburaId} IS NOT NULL THEN ${chaburasAlias.image}
          WHEN ${connAlias.id} IS NOT NULL THEN
            CASE WHEN ${connAlias.requesterId} = ${userId}
              THEN ${addrUser.image}
              ELSE ${reqUser.image}
            END
          ELSE NULL
        END`,
    })
    .from(sessionOccurrences)
    .innerJoin(
      learningSessions,
      eq(sessionOccurrences.sessionId, learningSessions.id),
    )
    .leftJoin(connAlias, eq(connAlias.id, learningSessions.chavrutaPairId))
    .leftJoin(reqUser, eq(reqUser.id, connAlias.requesterId))
    .leftJoin(addrUser, eq(addrUser.id, connAlias.addresseeId))
    .leftJoin(chaburasAlias, eq(chaburasAlias.id, learningSessions.chaburaId))
    .where(eq(sessionOccurrences.id, occurrenceId))
    .limit(1);

  return row ?? null;
}
