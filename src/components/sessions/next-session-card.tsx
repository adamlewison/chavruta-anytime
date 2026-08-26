import Link from "next/link";
import { DateTime } from "luxon";
import { Headset, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LiveKitJoinButton } from "@/components/sessions/livekit-join-button";
import { SessionUnderwayTicker } from "@/components/sessions/session-underway-ticker";
import type { DashboardSession } from "@/server/queries/dashboard";

export type NextSessionCardSize = "small" | "medium" | "large";

interface Props {
  session: DashboardSession;
  size?: NextSessionCardSize;
  timezone?: string;
}

function formatTimeUntil(minutesUntil: number, startsAt: DateTime, now: DateTime, tz: string): string {
  if (minutesUntil <= 0) return "Starting now";
  if (minutesUntil < 60) return `In ${Math.round(minutesUntil)} minutes`;
  const startsLocal = startsAt.setZone(tz);
  const nowLocal = now.setZone(tz);
  const dayDiff = startsLocal.startOf("day").diff(nowLocal.startOf("day"), "days").days;
  if (dayDiff === 0) return `Today at ${startsLocal.toFormat("h:mm a")}`;
  if (dayDiff === 1) return `Tomorrow at ${startsLocal.toFormat("h:mm a")}`;
  return startsLocal.toFormat("EEE, MMM d · h:mm a");
}

export function NextSessionCard({ session, size = "large", timezone = "UTC" }: Props) {
  const tz = timezone;
  const startsAt = DateTime.fromJSDate(session.startsAt, { zone: "utc" });
  const endsAt = DateTime.fromJSDate(session.endsAt, { zone: "utc" });
  const now = DateTime.utc();
  const minutesUntil = startsAt.diff(now, "minutes").minutes;
  const isOngoing = startsAt <= now && endsAt >= now;

  const partnerHref = session.chaburaSlug
    ? `/chaburas/${session.chaburaSlug}`
    : `/find/${session.partnerUserId}`;

  const detailsHref = `/sessions/${session.sessionId}/o/${session.occurrenceId}`;
  const title = session.title ?? "Learning Session";
  const partnerInitials = session.partnerName
    ? session.partnerName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  // ── Small ──────────────────────────────────────────────────────────────────
  if (size === "small") {
    return (
      <Link href={detailsHref}>
        <Card className="border-accent/30 bg-gradient-to-br from-primary/5 to-background hover:border-accent/60 transition-colors">
          <CardContent className="p-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm truncate">{title}</p>
              <Headset className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            </div>
            {isOngoing ? (
              <SessionUnderwayTicker
                startsAt={session.startsAt.toISOString()}
                endsAt={session.endsAt.toISOString()}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                {formatTimeUntil(minutesUntil, startsAt, now, tz)}
              </p>
            )}
            {session.partnerName && (
              <p className="text-xs text-muted-foreground truncate">
                {session.partnerName}
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  }

  // ── Medium ─────────────────────────────────────────────────────────────────
  if (size === "medium") {
    return (
      <Card className="border-accent/30 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-4 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <p className="font-semibold text-sm truncate">{title}</p>
              {isOngoing ? (
                <SessionUnderwayTicker
                  startsAt={session.startsAt.toISOString()}
                  endsAt={session.endsAt.toISOString()}
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {formatTimeUntil(minutesUntil, startsAt, now, tz)}
                </p>
              )}
            </div>
            <Video className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          </div>
          {session.partnerName && (
            <Link href={partnerHref} className="flex items-center gap-2 w-fit">
              <Avatar className="h-5 w-5">
                <AvatarImage src={session.partnerImage ?? undefined} />
                <AvatarFallback className="text-[9px]">
                  {partnerInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {session.partnerName}
              </span>
            </Link>
          )}
          <LiveKitJoinButton
            occurrenceId={session.occurrenceId}
            startsAt={session.startsAt.toISOString()}
            endsAt={session.endsAt.toISOString()}
            className="w-full h-8 text-sm"
          />
        </CardContent>
      </Card>
    );
  }

  // ── Large (default) ────────────────────────────────────────────────────────
  return (
    <Card className="border-accent/30 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="p-5 space-y-3">
        {session.partnerName && (
          <Link href={partnerHref} className="flex items-center gap-4 w-fit">
            <Avatar className="h-12 w-12 rounded-sm">
              <AvatarImage src={session.partnerImage ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {partnerInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-lg text-foreground">
              {session.partnerName}
            </span>
          </Link>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className=" text-foreground truncate text-sm">{title}</p>
            {isOngoing ? (
              <SessionUnderwayTicker
                startsAt={session.startsAt.toISOString()}
                endsAt={session.endsAt.toISOString()}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {formatTimeUntil(minutesUntil, startsAt, now, tz)}
              </p>
            )}
          </div>
        </div>

        <LiveKitJoinButton
          occurrenceId={session.occurrenceId}
          startsAt={session.startsAt.toISOString()}
          endsAt={session.endsAt.toISOString()}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}
