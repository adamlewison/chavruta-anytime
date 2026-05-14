"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface PollState {
  etag: string;
  ts: number;
  unread: {
    notifications: number;
    messages: Record<string, number>;
    totalMessages: number;
  };
  cursors: {
    latestNotificationId: string | null;
    latestMessageIdByConv: Record<string, string>;
  };
}

const BASE_INTERVAL = 5_000;
const BACKOFF_INTERVAL = 15_000;
const MAX_CONSECUTIVE_ERRORS = 2;

export function usePoll() {
  const queryClient = useQueryClient();
  const etagRef = useRef<string>("");
  const errCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevNotifIdRef = useRef<string | null | undefined>(undefined);
  const isFirstPollRef = useRef(true);

  const poll = useCallback(async () => {
    try {
      const headers: HeadersInit = {};
      if (etagRef.current) {
        headers["If-None-Match"] = etagRef.current;
      }

      const res = await fetch("/api/poll", { headers });

      if (res.status === 304) {
        errCountRef.current = 0;
        return;
      }

      if (!res.ok) {
        errCountRef.current++;
        return;
      }

      errCountRef.current = 0;
      const data: PollState = await res.json();
      etagRef.current = data.etag;

      // Update poll cache so badge components re-render
      queryClient.setQueryData(["poll"], data);

      // Toast on new notification (skip on first poll to avoid noise on load)
      const newNotifId = data.cursors.latestNotificationId;
      if (!isFirstPollRef.current && newNotifId && newNotifId !== prevNotifIdRef.current) {
        toast("You have a new notification", {
          action: {
            label: "View",
            onClick: () => { window.location.href = "/notifications"; },
          },
        });
      }
      isFirstPollRef.current = false;
      prevNotifIdRef.current = newNotifId;

      // Selectively invalidate changed queries
      if (data.unread.notifications > 0) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }

      if (data.unread.totalMessages > 0) {
        queryClient.invalidateQueries({ queryKey: ["messages"] });
        // Also invalidate specific conversations
        for (const convId of Object.keys(data.unread.messages)) {
          if (data.unread.messages[convId] > 0) {
            queryClient.invalidateQueries({
              queryKey: ["messages", convId],
            });
          }
        }
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    } catch {
      errCountRef.current++;
    }
  }, [queryClient]);

  const scheduleNext = useCallback(() => {
    const interval =
      errCountRef.current >= MAX_CONSECUTIVE_ERRORS
        ? BACKOFF_INTERVAL
        : BASE_INTERVAL;

    timerRef.current = setTimeout(async () => {
      if (document.visibilityState === "hidden") {
        scheduleNext();
        return;
      }
      await poll();
      scheduleNext();
    }, interval);
  }, [poll]);

  useEffect(() => {
    // Fire immediately
    poll().then(scheduleNext);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Fire immediately on tab focus
        poll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [poll, scheduleNext]);
}
