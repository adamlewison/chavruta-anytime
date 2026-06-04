"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { VoiceRoom } from "./voice-room";
import { IncomingCallModal } from "./incoming-call-modal";
import { useCall } from "@/hooks/use-call";
import { cn } from "@/lib/utils";

type ActiveCall = {
  id: string;
  roomName: string;
  startedAt: string | null;
};

export function ChaburaVoiceCall({
  chaburaId,
  chaburaName,
  userName,
  isMember,
}: {
  chaburaId: string;
  chaburaName: string;
  userName: string;
  isMember: boolean;
}) {
  const { state, startOrJoin, joinExisting, leave } = useCall(chaburaId, userName);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Poll for an active call every 5 s when not already in one
  useEffect(() => {
    if (state.phase === "active" || !isMember) return;

    let cancelled = false;

    async function poll() {
      const res = await fetch(`/api/calls?chaburaId=${chaburaId}`).catch(() => null);
      if (!res?.ok || cancelled) return;
      const { call } = await res.json();
      if (!cancelled) setActiveCall(call);
    }

    poll();
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [chaburaId, isMember, state.phase]);

  const showModal =
    activeCall &&
    state.phase === "idle" &&
    !dismissed;

  if (!isMember) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Phone className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Join this chabura to participate in voice calls.</p>
      </div>
    );
  }

  return (
    <>
      {/* Inline call UI */}
      <div className="flex flex-col gap-4">
        {state.phase === "active" ? (
          <VoiceRoom
            token={state.token}
            startedAt={state.startedAt}
            onLeave={() => leave(state.callId)}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Phone className="h-6 w-6 text-muted-foreground" />
            </div>

            {activeCall ? (
              <>
                <div>
                  <p className="text-sm font-medium text-foreground">Call in progress</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Someone started a call — jump in</p>
                </div>
                <button
                  onClick={() =>
                    joinExisting(
                      activeCall.id,
                      activeCall.roomName,
                      new Date(activeCall.startedAt ?? Date.now()),
                    )
                  }
                  disabled={state.phase === "joining"}
                  className={cn(
                    "rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors",
                    state.phase === "joining" && "opacity-60 cursor-not-allowed",
                  )}
                >
                  {state.phase === "joining" ? "Joining…" : "Join call"}
                </button>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium text-foreground">No active call</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Start a voice call for your chabura</p>
                </div>
                <button
                  onClick={startOrJoin}
                  disabled={state.phase === "joining"}
                  className={cn(
                    "rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors",
                    state.phase === "joining" && "opacity-60 cursor-not-allowed",
                  )}
                >
                  {state.phase === "joining" ? "Starting…" : "Start call"}
                </button>
              </>
            )}

            {state.phase === "error" && (
              <p className="text-xs text-red-500">{state.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Floating incoming-call toast when user is elsewhere on the page */}
      {showModal && (
        <IncomingCallModal
          chaburaName={chaburaName}
          onJoin={() => {
            setDismissed(false);
            joinExisting(
              activeCall.id,
              activeCall.roomName,
              new Date(activeCall.startedAt ?? Date.now()),
            );
          }}
          onDismiss={() => setDismissed(true)}
        />
      )}
    </>
  );
}
