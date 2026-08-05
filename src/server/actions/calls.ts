"use server";

import { db } from "@/db";
import { calls, sessionOccurrences } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
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

/** Marks a call as ended. */
export async function endCall(callId: string) {
  await db()
    .update(calls)
    .set({ status: "ended", endedAt: new Date() })
    .where(and(eq(calls.id, callId), eq(calls.status, "active")));
}
