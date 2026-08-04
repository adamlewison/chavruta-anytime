"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JoinButtonProps {
  meetUrl: string;
  startsAt: string;
  endsAt: string;
  className?: string;
}

type MeetingState = "upcoming" | "active" | "ended";

function getMeetingState(startsAt: string, endsAt: string): MeetingState {
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
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function JoinButton({ meetUrl, startsAt, endsAt, className }: JoinButtonProps) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const state = getMeetingState(startsAt, endsAt);

  if (state === "upcoming") {
    return (
      <Button
        disabled
        variant="outline"
        className={cn("cursor-not-allowed", className)}
      >
        Meeting starts in {formatTimeUntil(startsAt)}
      </Button>
    );
  }

  if (state === "active") {
    return (
      <Button
        asChild
        size="lg"
        className={cn(
          "bg-accent hover:bg-accent/90 text-white font-semibold",
          className
        )}
      >
        <a href={meetUrl} target="_blank" rel="noopener noreferrer">
          Join Meeting
        </a>
      </Button>
    );
  }

  return (
    <Button disabled variant="ghost" className={cn("text-muted-foreground", className)}>
      Meeting ended
    </Button>
  );
}
