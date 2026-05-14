import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { learningSessions, sessionOccurrences } from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { RRule } from "rrule";

export async function POST(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const database = db();

  // Find active sessions with < 10 future occurrences
  const now = new Date();
  const activeSessions = await database
    .select()
    .from(learningSessions)
    .where(eq(learningSessions.status, "active"));

  let created = 0;

  for (const session of activeSessions) {
    // Count future occurrences
    const futureCount = await database
      .select({ count: sql<number>`count(*)` })
      .from(sessionOccurrences)
      .where(
        and(
          eq(sessionOccurrences.sessionId, session.id),
          eq(sessionOccurrences.status, "scheduled"),
          gt(sessionOccurrences.startsAt, now)
        )
      );

    const count = Number(futureCount[0]?.count ?? 0);
    if (count >= 10) continue;

    // Expand RRULE forward to get 12 future occurrences
    if (!session.rrule || !session.dtstart) continue;

    try {
      const rule = RRule.fromString(session.rrule);
      const afterDate = now;
      const occurrences = rule.after(afterDate, true)
        ? rule
            .between(
              afterDate,
              new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              true
            )
            .slice(0, 12 - count)
        : [];

      for (const occ of occurrences) {
        const startsAt = new Date(occ);
        const endsAt = new Date(
          startsAt.getTime() + (session.durationMin ?? 60) * 60 * 1000
        );

        await database
          .insert(sessionOccurrences)
          .values({
            sessionId: session.id,
            startsAt,
            endsAt,
            status: "scheduled",
          })
          .onConflictDoNothing();
        created++;
      }
    } catch {
      // Skip sessions with invalid RRULEs
      continue;
    }
  }

  return NextResponse.json({ success: true, created });
}
