import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { messages, conversationMembers } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;

  // Verify membership
  const [membership] = await db()
    .select()
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, session.user.id),
      ),
    );

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const msgs = await db()
    .select({
      id: messages.id,
      senderId: messages.senderId,
      body: messages.body,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  const serialised = msgs.map((m) => ({
    ...m,
    createdAt: (m.createdAt ?? new Date()).toISOString(),
  }));

  return NextResponse.json(serialised, {
    headers: { "Cache-Control": "private, no-cache" },
  });
}
