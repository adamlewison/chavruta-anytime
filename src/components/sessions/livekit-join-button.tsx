"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  occurrenceId: string;
  startsAt: string;
  endsAt: string;
  className?: string;
}

function getWindowState(
  startsAt: string,
  endsAt: string,
): "upcoming" | "active" | "ended" {
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (now < start - 10 * 60 * 1000) return "upcoming";
  if (now <= end + 30 * 60 * 1000) return "active";
  return "ended";
}

function formatTimeUntil(startsAt: string): string {
  const diff = new Date(startsAt).getTime() - Date.now();
  if (diff <= 0) return "soon";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return hours < 24
    ? `${hours}h ${minutes % 60}m`
    : `${Math.floor(hours / 24)}d`;
}

export function LiveKitJoinButton({
  occurrenceId,
  startsAt,
  endsAt,
  className,
}: Props) {
  const router = useRouter();
  const [window, setWindow] = useState(() => getWindowState(startsAt, endsAt));

  useEffect(() => {
    const id = setInterval(
      () => setWindow(getWindowState(startsAt, endsAt)),
      30_000,
    );
    return () => clearInterval(id);
  }, [startsAt, endsAt]);

  if (window === "upcoming") {
    return (
      <Button
        disabled
        variant="outline"
        className={cn("cursor-not-allowed", className)}
      >
        <Clock className="h-4 w-4 mr-2" />
        Starts in {formatTimeUntil(startsAt)}
      </Button>
    );
  }

  if (window === "ended") {
    return (
      <Button
        disabled
        variant="ghost"
        className={cn("text-muted-foreground", className)}
      >
        Session ended
      </Button>
    );
  }

  return (
    <Button
      onClick={() => router.push(`/call/${occurrenceId}`)}
      className={cn(
        "bg-accent hover:bg-accent/90 text-white font-semibold",
        className,
      )}
    >
      <Radio className="h-4 w-4 mr-2" />
      Join Call
    </Button>
  );
}
