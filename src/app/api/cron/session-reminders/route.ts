import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listOccurrencesStartingSoon } from "@/server/queries/sessions";
import { hasSessionStartingSoonNotification } from "@/server/queries/notifications";
import { getConnectionPair } from "@/server/queries/connections";
import { listChaburaMemberIds } from "@/server/queries/chaburas";
import { createNotification } from "@/server/actions/notifications";

export async function POST(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const nineMinFromNow = new Date(now.getTime() + 9 * 60 * 1000);
  const elevenMinFromNow = new Date(now.getTime() + 11 * 60 * 1000);

  // Find occurrences starting in ~10 minutes
  const upcomingOccurrences = await listOccurrencesStartingSoon(nineMinFromNow, elevenMinFromNow);

  let created = 0;

  for (const { occurrence, session } of upcomingOccurrences) {
    // Check if notification already exists for this occurrence
    const alreadyNotified = await hasSessionStartingSoonNotification(occurrence.id);

    if (alreadyNotified) continue;

    // Determine participants based on session type
    const participantIds: string[] = [];

    if (session.type === "chavruta" && session.chavrutaPairId) {
      // Get both users from the connection
      const connection = await getConnectionPair(session.chavrutaPairId);

      if (connection) {
        participantIds.push(
          connection.requesterId,
          connection.addresseeId
        );
      }
    } else if (session.type === "chabura" && session.chaburaId) {
      // For chabura sessions, notify all members (rosh + member roles)
      participantIds.push(...(await listChaburaMemberIds(session.chaburaId)));
    } else {
      // Fallback: notify creator
      participantIds.push(session.createdById);
    }

    // Create notifications for all participants
    for (const userId of participantIds) {
      await createNotification(userId, "session_starting_soon", {
        occurrenceId: occurrence.id,
        sessionId: session.id,
        title: session.title,
        startsAt: occurrence.startsAt.toISOString(),
      });
      created++;
    }
  }

  return NextResponse.json({ success: true, created });
}
