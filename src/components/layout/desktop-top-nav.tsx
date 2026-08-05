"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Settings, LogOut, User } from "lucide-react";
import { navItems } from "@/components/layout/nav-items";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PollState } from "@/hooks/use-poll";

const desktopNavItems = navItems.filter((item) => !item.mobileOnly);

export function DesktopTopNav() {
  const pathname = usePathname();
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
      <TooltipProvider delayDuration={400}>
        <nav className="flex items-center gap-5">
          {desktopNavItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            const badgeCount = label === "Messages" ? unreadMessages : 0;

            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    aria-label={label}
                    className={cn(
                      "relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150",
                      isActive
                        ? "text-accent bg-accent/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted hover:scale-105",
                    )}
                  >
                    {isActive && (
                      <span className="absolute -bottom-2 inset-x-1 h-0.5 rounded-full bg-accent" />
                    )}
                    <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
                    {badgeCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>

      {/* Right side: notifications + profile */}
      <TooltipProvider delayDuration={400}>
        <div className="flex items-center gap-2 shrink-0">
          {/* Notification bell */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/notifications"
                aria-label="Notifications"
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150",
                  pathname === "/notifications"
                    ? "text-accent bg-accent/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted hover:scale-105",
                )}
              >
                <Bell
                  size={20}
                  strokeWidth={pathname === "/notifications" ? 2.25 : 1.75}
                />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              Notifications
            </TooltipContent>
          </Tooltip>

          {/* Profile avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-full ring-2 ring-transparent hover:ring-accent/40 transition-all focus:outline-none focus:ring-accent/60"
                aria-label="Profile menu"
              >
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage
                    src={user?.image ?? undefined}
                    alt={user?.name ?? "Profile"}
                    referrerPolicy="no-referrer"
                  />
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
                    <p className="font-medium text-foreground truncate">
                      {user.name}
                    </p>
                    {user.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
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
      </TooltipProvider>
    </header>
  );
}
