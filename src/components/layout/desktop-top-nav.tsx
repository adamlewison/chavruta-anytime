"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { House, Search, Users, MessageSquare, User, Bell, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PollState } from "@/lib/poll";

const navItems = [
  { label: "Home", href: "/dashboard", icon: House },
  { label: "Find", href: "/find", icon: Search },
  { label: "Chaburas", href: "/chaburas", icon: Users },
  { label: "Messages", href: "/messages", icon: MessageSquare },
] as const;

export function DesktopTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const { data: poll } = useQuery<PollState | null>({
    queryKey: ["poll"],
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
  });

  const unreadNotifications = poll?.unread.notifications ?? 0;
  const unreadMessages = poll?.unread.totalMessages ?? 0;

  const user = session?.user;
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  return (
    <header className="hidden md:flex sticky top-0 z-50 w-full items-center justify-between border-b border-border bg-background shadow-sm px-6 h-14">
      {/* Logo */}
      <Link href="/dashboard" className="shrink-0">
        <Logo size="sm" />
      </Link>

      {/* Primary nav links */}
      <nav className="flex items-center gap-1">
        {navItems.map(({ label, href }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          const badgeCount = label === "Messages" ? unreadMessages : 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-1.5 px-4 h-14 text-sm font-medium transition-colors border-b-2",
                isActive
                  ? "text-accent border-accent"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-border",
              )}
            >
              {label}
              {badgeCount > 0 && (
                <span className="min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right side: notifications + profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notification bell */}
        <Link
          href="/notifications"
          className={cn(
            "relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
            pathname === "/notifications"
              ? "text-accent bg-accent/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadNotifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </span>
          )}
        </Link>

        {/* Profile avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-full ring-2 ring-transparent hover:ring-accent/40 transition-all focus:outline-none focus:ring-accent/60"
              aria-label="Profile menu"
            >
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "Profile"} referrerPolicy="no-referrer" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {user?.name && (
              <>
                <DropdownMenuLabel className="font-normal">
                  <p className="font-medium text-foreground truncate">{user.name}</p>
                  {user.email && (
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
              onSelect={() => signOut({ callbackUrl: "/sign-in" })}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
