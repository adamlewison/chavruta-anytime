"use client";

import { useParticipants } from "@livekit/components-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SpeakingIndicator } from "./speaking-indicator";

function initials(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ParticipantList() {
  const participants = useParticipants();

  return (
    <div className="flex flex-col gap-2">
      {participants.map((p) => (
        <div key={p.identity} className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials(p.name)}</AvatarFallback>
          </Avatar>
          <span className="flex-1 text-sm text-foreground truncate">
            {p.name ?? p.identity}
          </span>
          <SpeakingIndicator participant={p} />
        </div>
      ))}
      {participants.length === 0 && (
        <p className="text-xs text-muted-foreground">No one else in the call yet.</p>
      )}
    </div>
  );
}
