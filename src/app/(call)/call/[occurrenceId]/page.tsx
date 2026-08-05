import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getCallPageDetail } from "@/server/queries/calls";
import { getChaburaMembershipRole } from "@/server/queries/chaburas";
import { getOrCreateCallForOccurrence } from "@/server/actions/calls";
import { AccessToken } from "livekit-server-sdk";
import { CallPageClient } from "./call-page-client";

export const dynamic = "force-dynamic";

export default async function CallPage({
  params,
}: {
  params: Promise<{ occurrenceId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!session.user.onboardedAt) redirect("/onboarding");

  const { occurrenceId } = await params;
  const userId = session.user.id;

  // Single query: occurrence + session + partner/chabura info
  const row = await getCallPageDetail(occurrenceId, userId);

  if (!row) notFound();

  // Auth check: creator or member of the chabura
  const isCreator = row.createdById === userId;
  if (!isCreator && row.chaburaId) {
    const role = await getChaburaMembershipRole(row.chaburaId, userId);
    if (!role || role === "pending") notFound();
  }

  // Get or create the call record atomically via a single CTE statement.
  // The INSERT + occurrence UPDATE happen in one round-trip, so concurrent
  // joiners can't produce duplicate call rows. ON CONFLICT preserves startedBy.
  const roomName = `session-${occurrenceId}`;

  const call = await getOrCreateCallForOccurrence(occurrenceId, roomName, userId);

  // Generate LiveKit token server-side
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity: userId, name: session.user.name ?? "Member" },
  );
  at.addGrant({
    room: call.room_name,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });
  const token = await at.toJwt();

  const detailsHref = `/sessions/${row.sessionId}/o/${occurrenceId}`;

  return (
    <CallPageClient
      token={token}
      roomName={call.room_name}
      callStartedAt={call.started_at ?? new Date().toISOString()}
      selfUserId={userId}
      selfName={session.user.name ?? "Me"}
      selfImage={session.user.image ?? null}
      partnerName={row.partnerName}
      partnerImage={row.partnerImage}
      sessionTitle={row.title ?? "Learning Session"}
      detailsHref={detailsHref}
      isChabura={row.chaburaId !== null}
    />
  );
}
