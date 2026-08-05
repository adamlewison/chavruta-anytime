import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/server/auth";
import {
  getSessionTitle,
  getSessionDetail,
  listUpcomingOccurrences,
} from "@/server/queries/sessions";
import { getConnectionPair } from "@/server/queries/connections";
import { getUserHeader } from "@/server/queries/users";
import { getChaburaNameImageSlug } from "@/server/queries/chaburas";
import { describeSchedule } from "@/domain/rrule";
import { SessionDetailView } from "@/components/sessions/session-detail-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const title = await getSessionTitle(id);
  return { title: title ?? "Session" };
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!session.user.onboardedAt) redirect("/onboarding");

  const { id } = await params;

  let sessionData: Awaited<ReturnType<typeof getSessionDetail>> | null = null;
  let partnerName: string | null = null;
  let partnerImage: string | null = null;
  let partnerId: string | null = null;
  let chaburaName: string | null = null;
  let chaburaImage: string | null = null;
  let chaburaSlug: string | null = null;
  let occurrences: Awaited<ReturnType<typeof listUpcomingOccurrences>> = [];

  try {
    const row = await getSessionDetail(id);

    if (!row) notFound();
    sessionData = row;

    // Resolve partner name (chavruta) or chabura name
    if (row.chavrutaPairId) {
      const conn = await getConnectionPair(row.chavrutaPairId);
      if (conn) {
        partnerId =
          conn.requesterId === session.user.id
            ? conn.addresseeId
            : conn.requesterId;
        const partner = await getUserHeader(partnerId);
        partnerName = partner?.name ?? null;
        partnerImage = partner?.image ?? null;
      }
    } else if (row.chaburaId) {
      const chab = await getChaburaNameImageSlug(row.chaburaId);
      chaburaName = chab?.name ?? null;
      chaburaImage = chab?.image ?? null;
      chaburaSlug = chab?.slug ?? null;
    }

    const now = new Date();
    occurrences = await listUpcomingOccurrences(id, now);
  } catch (err) {
    console.error("Session load error:", err);
    notFound();
  }

  if (!sessionData) notFound();

  const isOwner = sessionData.createdById === session.user.id;
  const scheduleLabel = describeSchedule(
    sessionData.rrule,
    sessionData.dtstart,
    sessionData.timezone,
  );

  return (
    <SessionDetailView
      id={id}
      sessionData={sessionData}
      isOwner={isOwner}
      scheduleLabel={scheduleLabel}
      partnerName={partnerName}
      partnerImage={partnerImage}
      partnerId={partnerId}
      chaburaName={chaburaName}
      chaburaImage={chaburaImage}
      chaburaSlug={chaburaSlug}
      occurrences={occurrences}
    />
  );
}
