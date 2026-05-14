"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { House, Search, Users, MessageSquare, User, Settings, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import type { PollState } from "@/lib/poll";

const navItems = [
  { label: "Home", href: "/dashboard", icon: House },
  { label: "Find", href: "/find", icon: Search },
  { label: "Chaburas", href: "/chaburas", icon: Users },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Profile", href: "/profile", icon: User },
] as const;

const secondaryItems = [
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function DesktopSidebar() {
  const pathname = usePathname();

  const { data: poll } = useQuery<PollState | null>({
    queryKey: ["poll"],
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
  });

  const unreadNotifications = poll?.unread.notifications ?? 0;
  const unreadMessages = poll?.unread.totalMessages ?? 0;

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-card h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border">
        <Link href="/dashboard">
          <Logo size="sm" />
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          const badgeCount = label === "Messages" ? unreadMessages : 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent/10 text-accent border-l-2 border-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon size={18} />
              {label}
              <Badge count={badgeCount} />
            </Link>
          );
        })}
      </nav>

      {/* Secondary nav */}
      <div className="px-2 py-3 border-t border-border space-y-0.5">
        {secondaryItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          const badgeCount = label === "Notifications" ? unreadNotifications : 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent/10 text-accent border-l-2 border-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon size={18} />
              {label}
              <Badge count={badgeCount} />
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
