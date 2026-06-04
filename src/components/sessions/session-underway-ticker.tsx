"use client";

import { useEffect, useState } from "react";

interface Props {
  startsAt: string;
  endsAt: string;
}

function elapsed(startsAt: string) {
  const totalSecs = Math.floor((Date.now() - new Date(startsAt).getTime()) / 1000);
  if (totalSecs < 0) return null;
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m ${s.toString().padStart(2, "0")}s`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export function SessionUnderwayTicker({ startsAt, endsAt }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isOver = now >= new Date(endsAt).getTime();

  if (isOver) {
    return (
      <span className="text-sm text-muted-foreground">Session completed</span>
    );
  }

  const label = elapsed(startsAt);

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 text-sm font-medium text-accent">
        <span className="h-2 w-2 rounded-full bg-accent animate-pulse inline-block" />
        Underway
      </span>
      {label && (
        <span className="text-sm text-muted-foreground">· {label}</span>
      )}
    </div>
  );
}
