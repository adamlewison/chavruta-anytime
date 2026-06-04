import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { connections, users, conversations, conversationMembers } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { ChavrutasView } from "@/components/connections/chavrutas-view";

export default async function ChavrutasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id;

  type ConnectionRow = {
    id: string;
    status: string;
    requesterId: string;
    addresseeId: string;
    otherName: string | null;
    otherImage: string | null;
    otherId: string;
    conversationId: string | null;
  };

  let accepted: ConnectionRow[] = [];
  let pendingReceived: ConnectionRow[] = [];
  let pendingSent: ConnectionRow[] = [];

  try {
    const rows = await db()
      .select({
        id: connections.id,
        status: connections.status,
        requesterId: connections.requesterId,
        addresseeId: connections.addresseeId,
        otherName: users.name,
        otherImage: users.image,
        otherId: users.id,
      })
      .from(connections)
      .innerJoin(
        users,
        or(
          and(eq(connections.requesterId, userId), eq(users.id, connections.addresseeId)),
          and(eq(connections.addresseeId, userId), eq(users.id, connections.requesterId)),
        )!,
      )
      .where(or(eq(connections.requesterId, userId), eq(connections.addresseeId, userId)));

    const myConvMemberships = await db()
      .select({ conversationId: conversationMembers.conversationId })
      .from(conversationMembers)
      .innerJoin(conversations, and(
        eq(conversations.id, conversationMembers.conversationId),
        eq(conversations.type, "dm"),
      ))
      .where(eq(conversationMembers.userId, userId));

    const myConvIds = myConvMemberships.map((m) => m.conversationId);

    const rowsWithConv = await Promise.all(
      rows.map(async (r) => {
        if (r.status !== "accepted") return { ...r, conversationId: null };
        let convId: string | null = null;
        for (const cid of myConvIds) {
          const [other] = await db()
            .select()
            .from(conversationMembers)
            .where(and(eq(conversationMembers.conversationId, cid), eq(conversationMembers.userId, r.otherId)));
          if (other) { convId = cid; break; }
        }
        return { ...r, conversationId: convId };
      }),
    );

    accepted = rowsWithConv.filter((r) => r.status === "accepted");
    pendingReceived = rowsWithConv.filter(
      (r) => r.status === "pending" && r.addresseeId === userId,
    );
    pendingSent = rowsWithConv.filter(
      (r) => r.status === "pending" && r.requesterId === userId,
    );
  } catch (err) {
    console.error("Chavrutas query error:", err);
  }

  return (
    <ChavrutasView
      accepted={accepted}
      pendingReceived={pendingReceived}
      pendingSent={pendingSent}
    />
  );
}
