"use client";

import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useIsSpeaking,
} from "@livekit/components-react";
import "@livekit/components-styles";
import type { Participant } from "livekit-client";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CallTimer } from "@/components/calls/call-timer";
import { ConnectionIndicator } from "@/components/calls/connection-indicator";
import { cn } from "@/lib/utils";

interface Props {
  token: string;
  roomName: string;
  callStartedAt: string;
  selfUserId: string;
  selfName: string;
  selfImage: string | null;
  partnerName: string | null;
  partnerImage: string | null;
  sessionTitle: string;
  detailsHref: string;
  isChabura: boolean;
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Rendered inside LiveKitRoom so hooks are available
function CallRoomUI({
  selfUserId,
  selfName,
  selfImage,
  partnerName,
  partnerImage,
  sessionTitle,
  callStartedAt,
  detailsHref,
  isChabura,
}: Omit<Props, "token" | "roomName">) {
  const router = useRouter();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const remoteParticipants = useParticipants().filter((p) => !p.isLocal);

  async function toggleMic() {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }

  function leave() {
    router.push(detailsHref);
  }

  // Show remote participants above self; fall back to a "waiting" tile if no one has joined yet
  const partnerParticipant = remoteParticipants[0] ?? null;
  const extraParticipants = remoteParticipants.slice(1);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white select-none">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-safe-top py-4 shrink-0">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white/90 leading-tight">
            {sessionTitle}
          </span>
          <ConnectionIndicator className="text-white/40 [&_span]:bg-opacity-80" />
        </div>
        <CallTimer startedAt={new Date(callStartedAt)} />
      </header>

      {/* Participant tiles */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 px-6 py-4">
        {/* Partner / chabura tile */}
        <ParticipantTile
          displayName={partnerName ?? (isChabura ? "Group" : "Partner")}
          displayImage={partnerImage}
          participant={partnerParticipant}
          isWaiting={partnerParticipant === null}
          label={isChabura ? "Chabura" : undefined}
        />

        {/* Self tile */}
        <SelfTile
          displayName={selfName}
          displayImage={selfImage}
          localParticipant={localParticipant}
          isMicrophoneEnabled={isMicrophoneEnabled}
        />

        {/* Extra chabura members in a subtle row */}
        {extraParticipants.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4">
            {extraParticipants.map((p) => (
              <ParticipantTile
                key={p.identity}
                displayName={p.name ?? p.identity}
                displayImage={null}
                participant={p}
                isWaiting={false}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>

      {/* Control bar */}
      <footer className="flex items-center justify-center gap-4 px-6 pb-safe-bottom py-6 shrink-0">
        <button
          onClick={toggleMic}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-2xl px-6 py-3 transition-colors",
            isMicrophoneEnabled
              ? "bg-white/10 hover:bg-white/15 text-white"
              : "bg-red-500/20 hover:bg-red-500/30 text-red-400",
          )}
          aria-label={isMicrophoneEnabled ? "Mute" : "Unmute"}
        >
          {isMicrophoneEnabled ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
          <span className="text-[11px] font-medium tracking-wide">
            {isMicrophoneEnabled ? "Mute" : "Unmuted"}
          </span>
        </button>

        <button
          onClick={leave}
          className="flex flex-col items-center gap-1.5 rounded-2xl bg-red-600 hover:bg-red-700 px-8 py-3 text-white transition-colors"
          aria-label="Leave call"
        >
          <PhoneOff className="h-5 w-5" />
          <span className="text-[11px] font-medium tracking-wide">Leave</span>
        </button>
      </footer>

      <RoomAudioRenderer />
    </div>
  );
}

// Remote participant tile (needs a live Participant or null for "waiting")
function ParticipantTile({
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

function SelfTile({
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

export function CallPageClient(props: Props) {
  return (
    <LiveKitRoom
      token={props.token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect
      audio
    >
      <CallRoomUI
        selfUserId={props.selfUserId}
        selfName={props.selfName}
        selfImage={props.selfImage}
        partnerName={props.partnerName}
        partnerImage={props.partnerImage}
        sessionTitle={props.sessionTitle}
        callStartedAt={props.callStartedAt}
        detailsHref={props.detailsHref}
        isChabura={props.isChabura}
      />
    </LiveKitRoom>
  );
}
