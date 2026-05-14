"use client";

import Link from "next/link";
import { markNotificationRead } from "@/server/actions/notifications";
import { cn } from "@/lib/utils";

interface NotificationLinkProps {
  id: string;
  href: string;
  unread: boolean;
  children: React.ReactNode;
}

export function NotificationLink({
  id,
  href,
  unread,
  children,
}: NotificationLinkProps) {
  function handleClick() {
    if (unread) {
      markNotificationRead(id).catch(() => {});
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 px-4 py-4 hover:bg-muted/40 transition-colors",
        unread && "bg-accent/5",
      )}
    >
      {children}
    </Link>
  );
}
