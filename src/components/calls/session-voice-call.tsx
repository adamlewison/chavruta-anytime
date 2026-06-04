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

export function SessionVoiceCall({
  occurrenceId,
  sessionName,
  userName,
}: {
  occurrenceId: string;
  sessionName: string;
  userName: string;
}) {
  const { state, startOrJoin, joinExisting, leave } = useCall(occurrenceId, userName);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Poll for an active call every 5 s when not already in one
  useEffect(() => {
    if (state.phase === "active") return;

    let cancelled = false;

    async function poll() {
      const res = await fetch(`/api/calls?occurrenceId=${occurrenceId}`).catch(() => null);
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
  }, [occurrenceId, state.phase]);

  const showModal = activeCall && state.phase === "idle" && !dismissed;

  return (
    <>
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
                  <p className="text-xs text-muted-foreground mt-0.5">Start the voice call for this session</p>
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

      {showModal && (
        <IncomingCallModal
          chaburaName={sessionName}
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
