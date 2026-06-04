"use client";

import { useLocalParticipant } from "@livekit/components-react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { ParticipantList } from "./participant-list";
import { ConnectionIndicator } from "./connection-indicator";
import { CallTimer } from "./call-timer";
import { cn } from "@/lib/utils";

export function VoiceCallUI({
  startedAt,
  onLeave,
}: {
  startedAt: Date;
  onLeave: () => void;
}) {
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();

  async function toggleMic() {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-foreground">Live call</span>
        </div>
        <div className="flex items-center gap-3">
          <CallTimer startedAt={startedAt} />
          <ConnectionIndicator />
        </div>
      </div>

      {/* Participants */}
      <ParticipantList />

      {/* Controls */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button
          onClick={toggleMic}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            isMicrophoneEnabled
              ? "bg-muted text-foreground hover:bg-muted/70"
              : "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400",
          )}
          aria-label={isMicrophoneEnabled ? "Mute" : "Unmute"}
        >
          {isMicrophoneEnabled ? (
            <Mic className="h-4 w-4" />
          ) : (
            <MicOff className="h-4 w-4" />
          )}
          {isMicrophoneEnabled ? "Mute" : "Unmute"}
        </button>

        <button
          onClick={onLeave}
          className="ml-auto flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          aria-label="Leave call"
        >
          <PhoneOff className="h-4 w-4" />
          Leave
        </button>
      </div>
    </div>
  );
}
