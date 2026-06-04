"use client";

import { useEffect, useState } from "react";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CallTimer({ startedAt }: { startedAt: Date }) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - startedAt.getTime()) / 1000),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <span className="font-mono text-sm tabular-nums text-muted-foreground">
      {formatDuration(elapsed)}
    </span>
  );
}
