import Link from "next/link";
import type { getSessionDetail, listUpcomingOccurrences } from "@/server/queries/sessions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { OccurrencesTable } from "@/components/sessions/occurrences-table";
import { Calendar, Clock, ChevronLeft, Pause, Play, X } from "lucide-react";
import { ChangeScheduleDialog } from "@/components/sessions/change-schedule-dialog";
import {
  pauseSession,
  resumeSession,
  cancelSession,
} from "@/server/actions/sessions";

type SessionData = NonNullable<Awaited<ReturnType<typeof getSessionDetail>>>;
type Occurrences = Awaited<ReturnType<typeof listUpcomingOccurrences>>;

const STATUS_COLORS: Record<string, string> = {
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  cancelled: "bg-destructive/10 text-destructive",
};

export function SessionDetailView({
  id,
  sessionData,
  isOwner,
  scheduleLabel,
  partnerName,
  partnerImage,
  partnerId,
  chaburaName,
  chaburaImage,
  chaburaSlug,
  occurrences,
}: {
  id: string;
  sessionData: SessionData;
  isOwner: boolean;
  scheduleLabel: string | null;
  partnerName: string | null;
  partnerImage: string | null;
  partnerId: string | null;
  chaburaName: string | null;
  chaburaImage: string | null;
  chaburaSlug: string | null;
  occurrences: Occurrences;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 -ml-2">
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-foreground truncate">
            {sessionData.title ?? "Learning Session"}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {sessionData.subjectName && (
              <Badge variant="secondary">{sessionData.subjectName}</Badge>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[sessionData.status] ?? ""}`}
            >
              {sessionData.status}
            </span>
          </div>
        </div>
      </div>

      {/* Chavruta / Chabura identity */}
      {(partnerName || chaburaName) && (
        <div className="flex items-center gap-3">
          {partnerName ? (
            <Link
              href={`/profile/${partnerId}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="size-12">
                {partnerImage && (
                  <AvatarImage src={partnerImage} alt={partnerName} />
                )}
                <AvatarFallback className="text-base">
                  {partnerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-foreground">
                {partnerName}
              </span>
            </Link>
          ) : (
            <Link
              href={`/chaburas/${chaburaSlug}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="size-12">
                {chaburaImage && (
                  <AvatarImage src={chaburaImage} alt={chaburaName!} />
                )}
                <AvatarFallback className="text-base">
                  {chaburaName!.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-foreground">
                {chaburaName}
              </span>
            </Link>
          )}
        </div>
      )}

      {/* Schedule info */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-foreground">Schedule</h2>
          {scheduleLabel && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{scheduleLabel}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {sessionData.durationMin} minutes ·{" "}
              {sessionData.timezone ?? "UTC"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Owner actions */}
      {isOwner && sessionData.status !== "cancelled" && (
        <div className="grid grid-cols-3 gap-2">
          <ChangeScheduleDialog
            sessionId={id}
            timezone={sessionData.timezone ?? "UTC"}
            durationMin={sessionData.durationMin ?? 60}
          />
          {sessionData.status === "active" ? (
            <form
              action={async () => {
                "use server";
                await pauseSession(id);
              }}
              className="contents"
            >
              <Button
                variant="outline"
                className="flex flex-col h-auto py-3 gap-1 w-full"
                type="submit"
              >
                <Pause className="h-4 w-4" />
                <span className="text-xs">Pause</span>
              </Button>
            </form>
          ) : (
            <form
              action={async () => {
                "use server";
                await resumeSession(id);
              }}
              className="contents"
            >
              <Button
                variant="outline"
                className="flex flex-col h-auto py-3 gap-1 w-full text-success"
                type="submit"
              >
                <Play className="h-4 w-4" />
                <span className="text-xs">Resume</span>
              </Button>
            </form>
          )}
          <form
            action={async () => {
              "use server";
              await cancelSession(id);
            }}
            className="contents"
          >
            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1 w-full text-destructive"
              type="submit"
            >
              <X className="h-4 w-4" />
              <span className="text-xs">Cancel</span>
            </Button>
          </form>
        </div>
      )}

      {/* Upcoming occurrences */}
      <div className="space-y-3">
        <h2 className="font-semibold text-foreground">Upcoming Sessions</h2>
        {occurrences.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming sessions scheduled.
          </p>
        ) : (
          <OccurrencesTable
            isOwner={isOwner}
            occurrences={occurrences.map((occ) => ({
              id: occ.id,
              sessionId: occ.sessionId,
              startsAt: occ.startsAt.toISOString(),
              endsAt: occ.endsAt.toISOString(),
              status: occ.status as
                | "scheduled"
                | "cancelled"
                | "completed"
                | "missed",
              meetUrl: occ.meetUrl ?? sessionData.meetUrl ?? "",
              title: sessionData.title ?? "Session",
            }))}
          />
        )}
      </div>
    </div>
  );
}
