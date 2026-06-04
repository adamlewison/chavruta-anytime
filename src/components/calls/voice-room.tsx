"use client";

import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { VoiceCallUI } from "./voice-call-ui";

export function VoiceRoom({
  token,
  startedAt,
  onLeave,
}: {
  token: string;
  startedAt: Date;
  onLeave: () => void;
}) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect
      audio
      onDisconnected={onLeave}
    >
      <VoiceCallUI startedAt={startedAt} onLeave={onLeave} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
