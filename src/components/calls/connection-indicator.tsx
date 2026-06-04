"use client";

import { useConnectionState } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { cn } from "@/lib/utils";

const STATE_LABELS: Record<ConnectionState, string> = {
  [ConnectionState.Disconnected]: "Disconnected",
  [ConnectionState.Connecting]: "Connecting…",
  [ConnectionState.Connected]: "Connected",
  [ConnectionState.Reconnecting]: "Reconnecting…",
  [ConnectionState.SignalReconnecting]: "Reconnecting…",
};

const STATE_COLORS: Record<ConnectionState, string> = {
  [ConnectionState.Disconnected]: "bg-red-500",
  [ConnectionState.Connecting]: "bg-yellow-400",
  [ConnectionState.Connected]: "bg-green-500",
  [ConnectionState.Reconnecting]: "bg-yellow-400",
  [ConnectionState.SignalReconnecting]: "bg-yellow-400",
};

export function ConnectionIndicator({ className }: { className?: string }) {
  const state = useConnectionState();

  return (
    <span className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span className={cn("h-2 w-2 rounded-full", STATE_COLORS[state])} />
      {STATE_LABELS[state]}
    </span>
  );
}
