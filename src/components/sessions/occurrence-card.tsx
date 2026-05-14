"use client";

import { DateTime } from "luxon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { JoinButton } from "./join-button";

interface OccurrenceCardProps {
  id: string;
  sessionId: string;
  startsAt: string;
  endsAt: string;
  status: "scheduled" | "cancelled" | "completed" | "missed";
  meetUrl: string;
  title: string;
  className?: string;
}

const STATUS_STYLES: Record<OccurrenceCardProps["status"], string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  missed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export function OccurrenceCard({
  id,
  sessionId,
  startsAt,
  endsAt,
  status,
  meetUrl,
  title,
  className,
}: OccurrenceCardProps) {
  const start = DateTime.fromISO(startsAt);
  const end = DateTime.fromISO(endsAt);

  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-3 bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm truncate">{title}</h4>
        <Badge className={cn("text-xs", STATUS_STYLES[status])}>{status}</Badge>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>{start.toFormat("EEEE, MMMM d, yyyy")}</p>
        <p>
          {start.toFormat("h:mm a")} &ndash; {end.toFormat("h:mm a ZZZZ")}
        </p>
      </div>

      {status === "scheduled" && (
        <JoinButton meetUrl={meetUrl} startsAt={startsAt} endsAt={endsAt} />
      )}
    </div>
  );
}
