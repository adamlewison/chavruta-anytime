import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { calls, sessionOccurrences, learningSessions, chaburaMembers } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// GET /api/calls?occurrenceId=xxx
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const occurrenceId = req.nextUrl.searchParams.get("occurrenceId");
  if (!occurrenceId) {
    return NextResponse.json({ error: "occurrenceId is required" }, { status: 400 });
  }

  const database = db();

  const [occurrence] = await database
    .select({ callId: sessionOccurrences.callId })
    .from(sessionOccurrences)
    .where(eq(sessionOccurrences.id, occurrenceId))
    .limit(1);

  if (!occurrence) {
    return NextResponse.json({ error: "Occurrence not found" }, { status: 404 });
  }

  if (!occurrence.callId) {
    return NextResponse.json({ call: null });
  }

  const [call] = await database
    .select()
    .from(calls)
    .where(and(eq(calls.id, occurrence.callId), eq(calls.status, "active")))
    .limit(1);

  return NextResponse.json({ call: call ?? null });
}

// POST /api/calls — start a call for an occurrence
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { occurrenceId } = await req.json();
  if (!occurrenceId) {
    return NextResponse.json({ error: "occurrenceId is required" }, { status: 400 });
  }

  const database = db();

  // Load occurrence + its parent session to check membership
  const [occurrence] = await database
    .select({
      id: sessionOccurrences.id,
      callId: sessionOccurrences.callId,
      sessionId: sessionOccurrences.sessionId,
    })
    .from(sessionOccurrences)
    .where(eq(sessionOccurrences.id, occurrenceId))
    .limit(1);

  if (!occurrence) {
    return NextResponse.json({ error: "Occurrence not found" }, { status: 404 });
  }

  const [ls] = await database
    .select({ chaburaId: learningSessions.chaburaId, createdById: learningSessions.createdById })
    .from(learningSessions)
    .where(eq(learningSessions.id, occurrence.sessionId))
    .limit(1);

  if (!ls) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Verify access: creator always allowed; chabura sessions check membership
  const isCreator = ls.createdById === session.user.id;
  if (!isCreator && ls.chaburaId) {
    const [membership] = await database
      .select({ role: chaburaMembers.role })
      .from(chaburaMembers)
      .where(
        and(
          eq(chaburaMembers.chaburaId, ls.chaburaId),
          eq(chaburaMembers.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!membership || membership.role === "pending") {
      return NextResponse.json({ error: "Not authorised for this session" }, { status: 403 });
    }
  }

  // If there's already an active call, return it so the caller can join instead
  if (occurrence.callId) {
    const [existing] = await database
      .select()
      .from(calls)
      .where(and(eq(calls.id, occurrence.callId), eq(calls.status, "active")))
      .limit(1);

    if (existing) return NextResponse.json({ call: existing });
  }

  const roomName = `session-${occurrenceId}`;

  // Upsert: insert the call, or if the room already exists (unique constraint on room_name)
  // reactivate it. This handles both the race-condition path (two users simultaneously
  // starting) and the restart path (call ended, session restarts).
  // The conditional UPDATE on session_occurrences (WHERE call_id IS NULL) is then used
  // to claim the call atomically — only one concurrent writer wins.
  const [upsertedCall] = await database
    .insert(calls)
    .values({ roomName, startedBy: session.user.id, status: "active" })
    .onConflictDoUpdate({
      target: calls.roomName,
      set: { status: "active", endedAt: null, startedBy: session.user.id },
    })
    .returning();

  const claimed = await database
    .update(sessionOccurrences)
    .set({ callId: upsertedCall.id })
    .where(and(eq(sessionOccurrences.id, occurrenceId), isNull(sessionOccurrences.callId)))
    .returning({ callId: sessionOccurrences.callId });

  if (claimed.length > 0) {
    return NextResponse.json({ call: upsertedCall });
  }

  // Another request won the race — re-fetch and return whatever is now linked.
  const [reloaded] = await database
    .select({ callId: sessionOccurrences.callId })
    .from(sessionOccurrences)
    .where(eq(sessionOccurrences.id, occurrenceId))
    .limit(1);

  const winnerId = reloaded?.callId;
  if (!winnerId) {
    return NextResponse.json({ error: "Failed to obtain call" }, { status: 500 });
  }

  const [winnerCall] = await database
    .select()
    .from(calls)
    .where(eq(calls.id, winnerId))
    .limit(1);

  return NextResponse.json({ call: winnerCall ?? null });
}

// PATCH /api/calls — end a call
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { callId } = await req.json();
  if (!callId) {
    return NextResponse.json({ error: "callId is required" }, { status: 400 });
  }

  await db()
    .update(calls)
    .set({ status: "ended", endedAt: new Date() })
    .where(and(eq(calls.id, callId), eq(calls.status, "active")));

  return NextResponse.json({ success: true });
}
