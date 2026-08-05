import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listConnectionsForUser } from "@/server/queries/connections";
import {
  listUserDmConversationIds,
  isConversationMember,
} from "@/server/queries/messages";
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
    const rows = await listConnectionsForUser(userId);

    const myConvIds = await listUserDmConversationIds(userId);

    const rowsWithConv = await Promise.all(
      rows.map(async (r) => {
        if (r.status !== "accepted") return { ...r, conversationId: null };
        let convId: string | null = null;
        for (const cid of myConvIds) {
          const isMember = await isConversationMember(cid, r.otherId);
          if (isMember) { convId = cid; break; }
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
