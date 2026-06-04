import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DateTime } from "luxon";
import {
  getAcceptedConnections,
  getUserChaburaIds,
  getDashboardSessions,
  getDashboardChaburas,
} from "@/lib/server/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/brand/empty-state";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users, BookOpen } from "lucide-react";
import { NextSessionCard } from "@/components/sessions/next-session-card";

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
  let myChavrutas: Array<{
    userId: string;
    name: string | null;
    image: string | null;
  }> = [];

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
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-8">
      <h1 className="text-2xl font-bold text-foreground">
        {greeting}, {userName}.
      </h1>

      {/* Next session card */}
      {nextSession && (
        <section>
          <NextSessionCard session={nextSession} size="large" />
        </section>
      )}

      {/* Upcoming this week */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Upcoming This Week
        </h2>
        {upcomingSessions.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {upcomingSessions.map((occ) => (
              <Link
                key={occ.occurrenceId}
                href={`/sessions/${occ.sessionId}/o/${occ.occurrenceId}`}
                className="block min-w-[200px] flex-shrink-0"
              >
                <Card className="hover:border-accent/50 transition-colors h-full">
                  <CardContent className="p-4 space-y-2">
                    <p className="font-medium text-sm line-clamp-2">
                      {occ.title ?? "Learning Session"}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {DateTime.fromJSDate(occ.startsAt)
                        .toLocal()
                        .toFormat("EEE, MMM d")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {DateTime.fromJSDate(occ.startsAt)
                        .toLocal()
                        .toFormat("h:mm a")}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            heading="No sessions this week"
            description="Schedule a learning session with a chavruta or chabura."
            action={{ label: "Find a Chavruta", href: "/find" }}
            letter="ל"
          />
        )}
      </section>

      {/* My chavrutas */}
      {myChavrutas.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              My Chavrutas
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/connections">See all</Link>
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1 -mx-4 px-4">
            {myChavrutas.map((chavruta) => {
              const initials =
                chavruta.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) ?? "?";
              return (
                <Link
                  key={chavruta.userId}
                  href={`/find/${chavruta.userId}`}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={chavruta.image ?? undefined} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground text-center max-w-[64px] truncate">
                    {chavruta.name?.split(" ")[0] ?? "Learner"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Active chaburas */}
      {activeChaburas.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              My Chaburas
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/chaburas">See all</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {activeChaburas.map((ch) => (
              <Link
                key={ch.id}
                href={`/chaburas/${ch.slug ?? ch.id}`}
                className="block"
              >
                <Card className="hover:border-accent/50 transition-colors">
                  <CardContent className="p-4 space-y-1.5">
                    <p className="font-medium text-sm line-clamp-2">
                      {ch.name ?? "Chabura"}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {ch.memberCount} member{ch.memberCount !== 1 ? "s" : ""}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New user CTA */}
      {upcomingSessions.length === 0 &&
        myChavrutas.length === 0 &&
        activeChaburas.length === 0 && (
          <Card className="border-accent/20 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-6 text-center space-y-4 relative overflow-hidden">
              <span className="absolute inset-0 flex items-center justify-center text-[8rem] text-foreground/5 select-none pointer-events-none">
                ב
              </span>
              <div className="relative space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  You haven&apos;t found a chavruta yet — let&apos;s fix that.
                </h3>
                <p className="text-sm text-muted-foreground">
                  Every chavruta starts somewhere. Find a learning partner
                  today.
                </p>
              </div>
              <Button
                asChild
                className="relative gap-2 bg-accent text-white hover:bg-accent/90"
              >
                <Link href="/find">
                  <BookOpen className="h-4 w-4" />
                  Find a Chavruta
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
