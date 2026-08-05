import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/server/auth";
import { getPublicProfileWithAvailability, listUserSubjectsWithHebrew } from "@/server/queries/profile";
import { getUserAvailabilityAndTimezone } from "@/server/queries/users";
import { getConnectionBetween } from "@/server/queries/connections";
import { listUserDmConversationIds, isConversationMember } from "@/server/queries/messages";
import { listChavrutaSessions } from "@/server/queries/sessions";
import { expandToUtcWeek, overlap, getNextSundayUtc } from "@/domain/availability";
import { ProfileView, type ProfileConnectionState, type OverlapData } from "@/components/profile/profile-view";

export const metadata: Metadata = {
  title: "User Profile — ChavrutaAnytime",
};

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (!session.user.onboardedAt) {
    redirect("/onboarding");
  }

  const { userId } = await params;

  if (userId === session.user.id) {
    redirect("/profile");
  }

  let viewedUser: Awaited<ReturnType<typeof getPublicProfileWithAvailability>> | null = null;
  let viewedUserSubjects: Awaited<ReturnType<typeof listUserSubjectsWithHebrew>> = [];
  let overlapData: OverlapData | null = null;
  let connectionState: ProfileConnectionState = "none";
  let connectionId: string | undefined;
  let conversationId: string | undefined;
  let sharedSessions: Awaited<ReturnType<typeof listChavrutaSessions>> = [];

  try {
    const viewedUserRow = await getPublicProfileWithAvailability(userId);

    if (!viewedUserRow) {
      notFound();
    }

    viewedUser = viewedUserRow;
    viewedUserSubjects = await listUserSubjectsWithHebrew(userId);

    const currentUser = await getUserAvailabilityAndTimezone(session.user.id);

    if (
      currentUser?.availability &&
      currentUser?.timezone &&
      viewedUser.availability &&
      viewedUser.timezone
    ) {
      const weekStart = getNextSundayUtc();
      const currentUtc = expandToUtcWeek(
        new Uint8Array(currentUser.availability),
        currentUser.timezone,
        weekStart,
      );
      const viewedUtc = expandToUtcWeek(
        new Uint8Array(viewedUser.availability),
        viewedUser.timezone,
        weekStart,
      );
      overlapData = overlap(currentUtc, viewedUtc);
    }

    // Look up connection state
    const conn = await getConnectionBetween(session.user.id, userId);

    if (conn) {
      connectionId = conn.id;
      if (conn.status === "accepted") {
        connectionState = "accepted";

        // DM conversation + sessions in parallel
        const [myConvIds, sessionRows] = await Promise.all([
          listUserDmConversationIds(session.user.id),
          listChavrutaSessions(conn.id),
        ]);

        for (const cid of myConvIds) {
          const isMember = await isConversationMember(cid, userId);
          if (isMember) {
            conversationId = cid;
            break;
          }
        }

        if (sessionRows.length > 0) {
          sharedSessions = sessionRows;
        }
      } else if (conn.status === "pending") {
        connectionState =
          conn.requesterId === session.user.id
            ? "pending_sent"
            : "pending_received";
      }
    }
  } catch (error) {
    console.error("User profile query error:", error);
    notFound();
  }

  if (!viewedUser) {
    notFound();
  }

  return (
    <ProfileView
      userId={userId}
      currentUserId={session.user.id}
      viewedUser={viewedUser}
      viewedUserSubjects={viewedUserSubjects}
      connectionState={connectionState}
      connectionId={connectionId}
      conversationId={conversationId}
      sharedSessions={sharedSessions}
      overlapData={overlapData}
    />
  );
}
