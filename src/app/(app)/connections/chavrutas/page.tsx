import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listConnectionsForUser } from "@/server/queries/connections";
import {
  listUserDmConversationIds,
  mapUsersToDmConversations,
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

    // Build a map of otherId → conversationId with a single batch query instead
    // of one query per connection × conversation.
    const acceptedOtherIds = rows
      .filter((r) => r.status === "accepted")
      .map((r) => r.otherId);

    const convsByOtherId = await mapUsersToDmConversations(
      myConvIds,
      acceptedOtherIds,
    );

    const rowsWithConv = rows.map((r) => ({
      ...r,
      conversationId:
        r.status === "accepted" ? (convsByOtherId.get(r.otherId) ?? null) : null,
    }));

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
