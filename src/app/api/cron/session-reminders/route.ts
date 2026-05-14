import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import {
  sessionOccurrences,
  learningSessions,
  notifications,
  connections,
  chaburaMembers,
} from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const database = db();

  const now = new Date();
  const nineMinFromNow = new Date(now.getTime() + 9 * 60 * 1000);
  const elevenMinFromNow = new Date(now.getTime() + 11 * 60 * 1000);

  // Find occurrences starting in ~10 minutes
  const upcomingOccurrences = await database
    .select({
      occurrence: sessionOccurrences,
      session: learningSessions,
    })
    .from(sessionOccurrences)
    .innerJoin(
      learningSessions,
      eq(sessionOccurrences.sessionId, learningSessions.id)
    )
    .where(
      and(
        eq(sessionOccurrences.status, "scheduled"),
        gte(sessionOccurrences.startsAt, nineMinFromNow),
        lte(sessionOccurrences.startsAt, elevenMinFromNow)
      )
    );

  let created = 0;

  for (const { occurrence, session } of upcomingOccurrences) {
    // Check if notification already exists for this occurrence
    const existing = await database
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.type, "session_starting_soon"),
          sql`${notifications.payload}->>'occurrenceId' = ${occurrence.id}`
        )
      );

    if (Number(existing[0]?.count ?? 0) > 0) continue;

    // Determine participants based on session type
    const participantIds: string[] = [];

    if (session.type === "chavruta" && session.chavrutaPairId) {
      // Get both users from the connection
      const connection = await database
        .select()
        .from(connections)
        .where(eq(connections.id, session.chavrutaPairId))
        .limit(1);

      if (connection[0]) {
        participantIds.push(
          connection[0].requesterId,
          connection[0].addresseeId
        );
      }
    } else if (session.type === "chabura" && session.chaburaId) {
      // For chabura sessions, notify all members (rosh + member roles)
      const members = await database
        .select({ userId: chaburaMembers.userId })
        .from(chaburaMembers)
        .where(eq(chaburaMembers.chaburaId, session.chaburaId));
      participantIds.push(...members.map((m) => m.userId));
    } else {
      // Fallback: notify creator
      participantIds.push(session.createdById);
    }

    // Create notifications for all participants
    for (const userId of participantIds) {
      await database.insert(notifications).values({
        userId,
        type: "session_starting_soon",
        payload: {
          occurrenceId: occurrence.id,
          sessionId: session.id,
          title: session.title,
          startsAt: occurrence.startsAt.toISOString(),
        },
      });
      created++;
    }
  }

  return NextResponse.json({ success: true, created });
}
