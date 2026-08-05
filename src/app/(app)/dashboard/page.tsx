import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { DateTime } from "luxon";
import {
  getAcceptedConnections,
  getUserChaburaIds,
  getDashboardSessions,
  getDashboardChaburas,
} from "@/server/queries/dashboard";
import { DashboardView, type DashboardChavruta } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (!session.user.onboardedAt) {
    redirect("/onboarding");
  }

  const userId = session.user.id;
  const userName = session.user.name?.split(" ")[0] || "friend";

  const now = DateTime.utc();

  let upcomingSessions: Awaited<
    ReturnType<typeof getDashboardSessions>
  >["upcomingSessions"] = [];
  let nextSession: Awaited<
    ReturnType<typeof getDashboardSessions>
  >["nextSession"] = null;
  let activeChaburas: Awaited<ReturnType<typeof getDashboardChaburas>> = [];
  let myChavrutas: DashboardChavruta[] = [];

  try {
    const [connectionRows, chaburaIds] = await Promise.all([
      getAcceptedConnections(userId),
      getUserChaburaIds(userId),
    ]);

    const connIds = connectionRows.map((c) => c.id);
    myChavrutas = connectionRows.slice(0, 6).map((c) => ({
      userId: c.chavrutaUserId,
      name: c.name,
      image: c.image,
    }));

    const [sessions, chaburas] = await Promise.all([
      getDashboardSessions(userId, connIds, chaburaIds, now),
      getDashboardChaburas(chaburaIds),
    ]);

    upcomingSessions = sessions.upcomingSessions;
    nextSession = sessions.nextSession;
    activeChaburas = chaburas;
  } catch (error) {
    console.error("Dashboard query error:", error);
  }

  const hour = now.hour;
  const greeting = hour < 12 ? "Boker tov" : hour < 18 ? "Shalom" : "Erev tov";

  return (
    <DashboardView
      userName={userName}
      greeting={greeting}
      nextSession={nextSession}
      upcomingSessions={upcomingSessions}
      myChavrutas={myChavrutas}
      activeChaburas={activeChaburas}
    />
  );
}
