import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  sessionOccurrences,
  learningSessions,
  connections,
  chaburas,
  users,
  chaburaMembers,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { AccessToken } from "livekit-server-sdk";
import { CallPageClient } from "./call-page-client";

export const dynamic = "force-dynamic";

export default async function CallPage({
  params,
}: {
  params: Promise<{ occurrenceId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!session.user.onboardedAt) redirect("/onboarding");

  const { occurrenceId } = await params;
  const userId = session.user.id;

  const reqUser = alias(users, "req_user");
  const addrUser = alias(users, "addr_user");
  const connAlias = alias(connections, "conn");
  const chaburasAlias = alias(chaburas, "chab");

  // Single query: occurrence + session + partner/chabura info
  const database = db();

  const [row] = await database
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

  if (!row) notFound();

  // Auth check: creator or member of the chabura
  const isCreator = row.createdById === userId;
  if (!isCreator && row.chaburaId) {
    const [membership] = await database
      .select({ role: chaburaMembers.role })
      .from(chaburaMembers)
      .where(
        and(
          eq(chaburaMembers.chaburaId, row.chaburaId),
          eq(chaburaMembers.userId, userId),
        ),
      )
      .limit(1);
    if (!membership || membership.role === "pending") notFound();
  }

  // Get or create the call record atomically via a single CTE statement.
  // The INSERT + occurrence UPDATE happen in one round-trip, so concurrent
  // joiners can't produce duplicate call rows. ON CONFLICT preserves startedBy.
  const roomName = `session-${occurrenceId}`;

  const { rows: [call] } = await database.execute<{
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

  // Generate LiveKit token server-side
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity: userId, name: session.user.name ?? "Member" },
  );
  at.addGrant({
    room: call.room_name,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });
  const token = await at.toJwt();

  const detailsHref = `/sessions/${row.sessionId}/o/${occurrenceId}`;

  return (
    <CallPageClient
      token={token}
      roomName={call.room_name}
      callStartedAt={call.started_at ?? new Date().toISOString()}
      selfUserId={userId}
      selfName={session.user.name ?? "Me"}
      selfImage={session.user.image ?? null}
      partnerName={row.partnerName}
      partnerImage={row.partnerImage}
      sessionTitle={row.title ?? "Learning Session"}
      detailsHref={detailsHref}
      isChabura={row.chaburaId !== null}
    />
  );
}
