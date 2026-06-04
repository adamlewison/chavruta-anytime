"use client";

import { useIsSpeaking } from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { cn } from "@/lib/utils";

export function SpeakingIndicator({
  participant,
  className,
}: {
  participant: Participant;
  className?: string;
}) {
  const isSpeaking = useIsSpeaking(participant);

  return (
    <span
      className={cn(
        "flex items-end gap-px h-4 w-4",
        !isSpeaking && "opacity-30",
        className,
      )}
      aria-label={isSpeaking ? "Speaking" : "Silent"}
    >
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-full bg-green-500 transition-all duration-150",
            isSpeaking ? "animate-pulse" : "",
          )}
          style={{
            height: isSpeaking ? `${[40, 100, 60][i - 1]}%` : "20%",
            animationDelay: `${(i - 1) * 80}ms`,
          }}
        />
      ))}
    </span>
  );
}
