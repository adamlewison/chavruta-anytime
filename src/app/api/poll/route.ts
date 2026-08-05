import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema/notifications";
import { messages, conversationMembers } from "@/db/schema/messages";
import { eq, ne, sql, and, gt, isNull } from "drizzle-orm";
import type { PollState } from "@/hooks/use-poll";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const database = db();

  // Query latest notification id and unread count
  const [notifResult] = await database
    .select({
      latestId: sql<string | null>`max(${notifications.createdAt})`,
      unreadCount: sql<number>`count(*) filter (where ${notifications.readAt} is null)`,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId));

  // Query unread messages per conversation
  const memberRows = await database
    .select({
      conversationId: conversationMembers.conversationId,
      lastReadAt: conversationMembers.lastReadAt,
    })
    .from(conversationMembers)
    .where(eq(conversationMembers.userId, userId));

  const messagesPerConv: Record<string, number> = {};
  const latestMessageIdByConv: Record<string, string> = {};
  let totalMessages = 0;

  for (const row of memberRows) {
    const conditions = [
      eq(messages.conversationId, row.conversationId),
      ne(messages.senderId, userId),
    ];
    if (row.lastReadAt) {
      conditions.push(gt(messages.createdAt, row.lastReadAt));
    }

    const [msgResult] = await database
      .select({
        count: sql<number>`count(*)`,
        latestId: sql<string | null>`max(${messages.createdAt})`,
      })
      .from(messages)
      .where(and(...conditions));

    const unreadCount = Number(msgResult.count) || 0;
    if (unreadCount > 0) {
      messagesPerConv[row.conversationId] = unreadCount;
      totalMessages += unreadCount;
    }
    if (msgResult.latestId) {
      latestMessageIdByConv[row.conversationId] = msgResult.latestId;
    }
  }

  const pollState: PollState = {
    etag: "",
    ts: Date.now(),
    unread: {
      notifications: Number(notifResult.unreadCount) || 0,
      messages: messagesPerConv,
      totalMessages,
    },
    cursors: {
      latestNotificationId: notifResult.latestId || null,
      latestMessageIdByConv,
    },
  };

  // Build etag from state
  const etag = `"${Buffer.from(
    JSON.stringify({
      n: pollState.cursors.latestNotificationId,
      m: pollState.cursors.latestMessageIdByConv,
      un: pollState.unread.notifications,
      tm: totalMessages,
    })
  ).toString("base64url")}"`;

  pollState.etag = etag;

  // Check If-None-Match
  const ifNoneMatch = request.headers.get("If-None-Match");
  if (ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304 });
  }

  return NextResponse.json(pollState, {
    headers: {
      ETag: etag,
      "Cache-Control": "private, no-cache",
    },
  });
}
