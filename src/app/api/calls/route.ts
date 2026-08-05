import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  getOccurrenceCallId,
  getOccurrenceForCallStart,
  getSessionAccessInfo,
  getActiveCall,
  getCallById,
} from "@/server/queries/calls";
import { getChaburaMembershipRole } from "@/server/queries/chaburas";
import { upsertActiveCall, claimOccurrenceCall, endCall } from "@/server/actions/calls";

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

  const occurrence = await getOccurrenceCallId(occurrenceId);

  if (!occurrence) {
    return NextResponse.json({ error: "Occurrence not found" }, { status: 404 });
  }

  if (!occurrence.callId) {
    return NextResponse.json({ call: null });
  }

  const call = await getActiveCall(occurrence.callId);

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

  // Load occurrence + its parent session to check membership
  const occurrence = await getOccurrenceForCallStart(occurrenceId);

  if (!occurrence) {
    return NextResponse.json({ error: "Occurrence not found" }, { status: 404 });
  }

  const ls = await getSessionAccessInfo(occurrence.sessionId);

  if (!ls) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Verify access: creator always allowed; chabura sessions check membership
  const isCreator = ls.createdById === session.user.id;
  if (!isCreator && ls.chaburaId) {
    const role = await getChaburaMembershipRole(ls.chaburaId, session.user.id);

    if (!role || role === "pending") {
      return NextResponse.json({ error: "Not authorised for this session" }, { status: 403 });
    }
  }

  // If there's already an active call, return it so the caller can join instead
  if (occurrence.callId) {
    const existing = await getActiveCall(occurrence.callId);

    if (existing) return NextResponse.json({ call: existing });
  }

  const roomName = `session-${occurrenceId}`;

  // Upsert: insert the call, or if the room already exists (unique constraint on room_name)
  // reactivate it. This handles both the race-condition path (two users simultaneously
  // starting) and the restart path (call ended, session restarts).
  // The conditional UPDATE on session_occurrences (WHERE call_id IS NULL) is then used
  // to claim the call atomically — only one concurrent writer wins.
  const upsertedCall = await upsertActiveCall(roomName, session.user.id);

  const claimed = await claimOccurrenceCall(occurrenceId, upsertedCall.id);

  if (claimed.length > 0) {
    return NextResponse.json({ call: upsertedCall });
  }

  // Another request won the race — re-fetch and return whatever is now linked.
  const reloaded = await getOccurrenceCallId(occurrenceId);

  const winnerId = reloaded?.callId;
  if (!winnerId) {
    return NextResponse.json({ error: "Failed to obtain call" }, { status: 500 });
  }

  const winnerCall = await getCallById(winnerId);

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

  await endCall(callId);

  return NextResponse.json({ success: true });
}
