"use client";

import { usePoll } from "@/hooks/use-poll";

/** Mounts the global poll loop. Renders nothing — drop it anywhere in the app shell. */
export function PollProvider() {
  usePoll();
  return null;
}
