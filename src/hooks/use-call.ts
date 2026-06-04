"use client";

import { useState, useCallback } from "react";

type CallState =
  | { phase: "idle" }
  | { phase: "joining" }
  | { phase: "active"; token: string; callId: string; startedAt: Date }
  | { phase: "error"; message: string };

export function useCall(occurrenceId: string, userName: string) {
  const [state, setState] = useState<CallState>({ phase: "idle" });

  const startOrJoin = useCallback(async () => {
    setState({ phase: "joining" });

    try {
      const callRes = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occurrenceId }),
      });

      if (!callRes.ok) {
        const err = await callRes.json();
        throw new Error(err.error ?? "Failed to start call");
      }

      const { call } = await callRes.json();

      const tokenRes = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: call.roomName, userName }),
      });

      if (!tokenRes.ok) throw new Error("Failed to get call token");

      const { token } = await tokenRes.json();

      setState({
        phase: "active",
        token,
        callId: call.id,
        startedAt: new Date(call.startedAt ?? Date.now()),
      });
    } catch (err) {
      setState({ phase: "error", message: (err as Error).message });
    }
  }, [occurrenceId, userName]);

  const joinExisting = useCallback(
    async (callId: string, roomName: string, startedAt: Date) => {
      setState({ phase: "joining" });

      try {
        const tokenRes = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName, userName }),
        });

        if (!tokenRes.ok) throw new Error("Failed to get call token");

        const { token } = await tokenRes.json();
        setState({ phase: "active", token, callId, startedAt });
      } catch (err) {
        setState({ phase: "error", message: (err as Error).message });
      }
    },
    [userName],
  );

  const leave = useCallback(async (callId: string) => {
    setState({ phase: "idle" });

    await fetch("/api/calls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId }),
    }).catch(() => {});
  }, []);

  return { state, startOrJoin, joinExisting, leave };
}
