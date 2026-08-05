import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { isConversationMember, listConversationMessages } from "@/server/queries/messages";

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
  const isMember = await isConversationMember(conversationId, session.user.id);

  if (!isMember) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const msgs = await listConversationMessages(conversationId);

  const serialised = msgs.map((m) => ({
    ...m,
    createdAt: (m.createdAt ?? new Date()).toISOString(),
  }));

  return NextResponse.json(serialised, {
    headers: { "Cache-Control": "private, no-cache" },
  });
}
