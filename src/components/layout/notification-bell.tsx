"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { PollState } from "@/hooks/use-poll";

export function NotificationBell() {
  // Subscribe to poll cache so we re-render when usePoll calls setQueryData
  const { data: poll } = useQuery<PollState | null>({
    queryKey: ["poll"],
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
  });

  const count = poll?.unread.notifications ?? 0;

  return (
    <Link href="/notifications" className="relative p-1">
      <Bell size={20} className="text-foreground" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
