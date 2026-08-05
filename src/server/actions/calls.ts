"use server";

import { db } from "@/db";
import { calls, sessionOccurrences } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { uuid } from "@/domain/schemas/common";
import { firstError } from "@/domain/schemas/common";

/**
 * Insert a new active call for `roomName`, or reactivate it if a call for
 * that room already exists (unique constraint on room_name). Returns the
 * resulting call row.
 */
export async function upsertActiveCall(roomName: string, startedBy: string) {
  const parsed = uuid.safeParse(startedBy);
  if (!parsed.success) throw new Error(firstError(parsed.error));

  const [upsertedCall] = await db()
    .insert(calls)
    .values({ roomName, startedBy, status: "active" })
    .onConflictDoUpdate({
      target: calls.roomName,
      set: { status: "active", endedAt: null, startedBy },
    })
    .returning();

  return upsertedCall;
}

/** Atomically claims a call for an occurrence that doesn't already have one. */
export async function claimOccurrenceCall(occurrenceId: string, callId: string) {
  const parsed = uuid.safeParse(occurrenceId);
  if (!parsed.success) return [];

  return db()
    .update(sessionOccurrences)
    .set({ callId })
    .where(and(eq(sessionOccurrences.id, occurrenceId), isNull(sessionOccurrences.callId)))
    .returning({ callId: sessionOccurrences.callId });
}

/**
 * Get-or-create the active call for an occurrence's room, atomically, via a
 * single CTE statement: the INSERT (or reactivate, on room_name conflict)
 * and the occurrence's call_id UPDATE happen in one round-trip, so
 * concurrent joiners can't produce duplicate call rows. ON CONFLICT
 * preserves startedBy.
 */
export async function getOrCreateCallForOccurrence(
  occurrenceId: string,
  roomName: string,
  userId: string,
) {
  const { rows: [call] } = await db().execute<{
    id: string;
    room_name: string;
    started_at: string | null;
  }>(sql`
    WITH ins AS (
      INSERT INTO calls (room_name, started_by, status)
      VALUES (${roomName}, ${userId}, 'active')
      ON CONFLICT (room_name) DO UPDATE
        SET status = 'active', ended_at = NULL
      RETURNING id, room_name, started_at
    ),
    upd AS (
      UPDATE session_occurrences
      SET call_id = ins.id
      FROM ins
      WHERE session_occurrences.id = ${occurrenceId}
        AND session_occurrences.call_id IS NULL
    )
    SELECT id, room_name, started_at FROM ins
  `);

  return call;
}

/** Marks a call as ended. */
export async function endCall(callId: string) {
  await db()
    .update(calls)
    .set({ status: "ended", endedAt: new Date() })
    .where(and(eq(calls.id, callId), eq(calls.status, "active")));
}
