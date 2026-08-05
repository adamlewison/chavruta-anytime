import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listActiveSessions, countFutureOccurrences } from "@/server/queries/sessions";
import { createOccurrence } from "@/server/actions/sessions";
import { RRule } from "rrule";

export async function POST(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find active sessions with < 10 future occurrences
  const now = new Date();
  const activeSessions = await listActiveSessions();

  let created = 0;

  for (const session of activeSessions) {
    // Count future occurrences
    const count = await countFutureOccurrences(session.id, now);
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

        await createOccurrence(session.id, startsAt, endsAt);
        created++;
      }
    } catch {
      // Skip sessions with invalid RRULEs
      continue;
    }
  }

  return NextResponse.json({ success: true, created });
}
