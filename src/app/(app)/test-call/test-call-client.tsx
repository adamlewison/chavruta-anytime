"use client";

import { useState } from "react";
import { DateTime } from "luxon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoiceRoom } from "@/components/calls/voice-room";
import { Phone, PhoneCall } from "lucide-react";

type Occurrence = {
  occurrenceId: string;
  sessionId: string;
  title: string | null;
  startsAt: string;
  endsAt: string;
  callId: string | null;
  callStatus: "active" | "ended" | null;
};

export function TestCallClient({
  occurrences,
  userName,
}: {
  occurrences: Occurrence[];
  userName: string;
}) {
  const [activeCall, setActiveCall] = useState<{
    occurrenceId: string;
    token: string;
    startedAt: Date;
  } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateCall(occ: Occurrence) {
    setLoadingId(occ.occurrenceId);
    setError(null);

    try {
      const callRes = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occurrenceId: occ.occurrenceId }),
      });

      if (!callRes.ok) {
        const data = await callRes.json();
        throw new Error(data.error ?? "Failed to create call");
      }

      const { call } = await callRes.json();

      const tokenRes = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: call.roomName, userName }),
      });

      if (!tokenRes.ok) throw new Error("Failed to get LiveKit token");

      const { token } = await tokenRes.json();

      setActiveCall({
        occurrenceId: occ.occurrenceId,
        token,
        startedAt: new Date(call.startedAt),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoadingId(null);
    }
  }

  if (activeCall) {
    const occ = occurrences.find((o) => o.occurrenceId === activeCall.occurrenceId);
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground">{occ?.title ?? "Learning Session"}</p>
          <p className="text-xs text-muted-foreground">
            {DateTime.fromISO(occ!.startsAt).toLocal().toFormat("EEE, MMM d · h:mm a")}
          </p>
        </div>
        <VoiceRoom
          token={activeCall.token}
          startedAt={activeCall.startedAt}
          onLeave={() => setActiveCall(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {occurrences.length === 0 && (
        <p className="text-sm text-muted-foreground">No upcoming session occurrences found.</p>
      )}
      {occurrences.map((occ) => {
        const hasActiveCall = occ.callStatus === "active";
        const dt = DateTime.fromISO(occ.startsAt).toLocal();
        const isLoading = loadingId === occ.occurrenceId;

        return (
          <Card key={occ.occurrenceId}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{occ.title ?? "Learning Session"}</p>
                <p className="text-xs text-muted-foreground">
                  {dt.toFormat("EEE, MMM d · h:mm a")}
                </p>
                {hasActiveCall && (
                  <span className="inline-flex items-center gap-1 mt-0.5 text-xs text-green-600 dark:text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Call in progress
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant={hasActiveCall ? "default" : "outline"}
                className="shrink-0"
                disabled={isLoading}
                onClick={() => handleCreateCall(occ)}
              >
                {isLoading ? (
                  "Connecting…"
                ) : hasActiveCall ? (
                  <>
                    <PhoneCall className="h-3.5 w-3.5 mr-1.5" />
                    Join Call
                  </>
                ) : (
                  <>
                    <Phone className="h-3.5 w-3.5 mr-1.5" />
                    Create Call
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
