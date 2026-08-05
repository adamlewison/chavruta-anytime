"use client";

import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { CallTimer } from "@/components/calls/call-timer";
import { ConnectionIndicator } from "@/components/calls/connection-indicator";
import { ParticipantTile, SelfTile } from "@/components/calls/participant-tile";
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
