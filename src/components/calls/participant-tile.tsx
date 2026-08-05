"use client";

import { useIsSpeaking } from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { MicOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Remote participant tile (needs a live Participant or null for "waiting")
export function ParticipantTile({
  displayName,
  displayImage,
  participant,
  isWaiting,
  label,
  size = "lg",
}: {
  displayName: string;
  displayImage: string | null;
  participant: Participant | null;
  isWaiting: boolean;
  label?: string;
  size?: "lg" | "sm";
}) {
  if (!participant) {
    return (
      <WaitingTile
        displayName={displayName}
        displayImage={displayImage}
        label={label}
        size={size}
      />
    );
  }
  return (
    <LiveRemoteTile
      displayName={displayName}
      displayImage={displayImage}
      participant={participant}
      label={label}
      size={size}
    />
  );
}

function LiveRemoteTile({
  displayName,
  displayImage,
  participant,
  label,
  size,
}: {
  displayName: string;
  displayImage: string | null;
  participant: Participant;
  label?: string;
  size: "lg" | "sm";
}) {
  const isSpeaking = useIsSpeaking(participant);
  const isMuted = !participant.isMicrophoneEnabled;
  const avatarSize = size === "lg" ? "h-24 w-24 md:h-28 md:w-28" : "h-14 w-14";

  return (
    <TileShell
      displayName={displayName}
      displayImage={displayImage}
      isSpeaking={isSpeaking}
      isMuted={isMuted}
      label={label}
      avatarSize={avatarSize}
      size={size}
    />
  );
}

export function SelfTile({
  displayName,
  displayImage,
  localParticipant,
  isMicrophoneEnabled,
}: {
  displayName: string;
  displayImage: string | null;
  localParticipant: Participant;
  isMicrophoneEnabled: boolean;
}) {
  const isSpeaking = useIsSpeaking(localParticipant);
  return (
    <TileShell
      displayName={displayName}
      displayImage={displayImage}
      isSpeaking={isSpeaking}
      isMuted={!isMicrophoneEnabled}
      label="You"
      avatarSize="h-24 w-24 md:h-28 md:w-28"
      size="lg"
    />
  );
}

function WaitingTile({
  displayName,
  displayImage,
  label,
  size = "lg",
}: {
  displayName: string;
  displayImage: string | null;
  label?: string;
  size?: "lg" | "sm";
}) {
  const avatarSize = size === "lg" ? "h-24 w-24 md:h-28 md:w-28" : "h-14 w-14";
  return (
    <TileShell
      displayName={displayName}
      displayImage={displayImage}
      isSpeaking={false}
      isMuted={false}
      label={label}
      avatarSize={avatarSize}
      size={size}
      waiting
    />
  );
}

function TileShell({
  displayName,
  displayImage,
  isSpeaking,
  isMuted,
  label,
  avatarSize,
  size,
  waiting,
}: {
  displayName: string;
  displayImage: string | null;
  isSpeaking: boolean;
  isMuted: boolean;
  label?: string;
  avatarSize: string;
  size: "lg" | "sm";
  waiting?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3",
        size === "lg" ? "min-w-[140px]" : "min-w-[80px]",
      )}
    >
      <div className="relative">
        {/* Speaking ring */}
        <div
          className={cn(
            "absolute -inset-1.5 rounded-full transition-all duration-300",
            isSpeaking
              ? "ring-[3px] ring-green-400 shadow-[0_0_16px_4px_rgba(74,222,128,0.35)]"
              : "ring-[3px] ring-transparent",
          )}
        />
        <Avatar className={cn(avatarSize, "relative z-10")}>
          <AvatarImage src={displayImage ?? undefined} />
          <AvatarFallback
            className={cn(
              "font-semibold",
              size === "lg"
                ? "text-lg bg-zinc-800 text-white"
                : "text-sm bg-zinc-800 text-white",
            )}
          >
            {initials(displayName)}
          </AvatarFallback>
        </Avatar>
        {/* Muted badge */}
        {isMuted && (
          <span className="absolute bottom-0 right-0 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 ring-2 ring-zinc-950">
            <MicOff className="h-2.5 w-2.5 text-white" />
          </span>
        )}
      </div>

      {size === "lg" && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-semibold text-white/90">
            {displayName}
          </span>
          {label && (
            <span className="text-[11px] text-white/40 tracking-wide uppercase">
              {label}
            </span>
          )}
          {waiting && (
            <span className="text-[11px] text-white/30 italic">
              Waiting to join…
            </span>
          )}
        </div>
      )}
    </div>
  );
}
