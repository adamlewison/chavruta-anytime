"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { PollState } from "@/hooks/use-poll";
import { navItems } from "@/components/layout/nav-items";

const tabs = navItems.filter((item) => !item.desktopOnly);

export function BottomTabs() {
  const pathname = usePathname();

  const { data: poll } = useQuery<PollState | null>({
    queryKey: ["poll"],
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
  });

  const unreadMessages = poll?.unread.totalMessages ?? 0;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center justify-around">
        {tabs.map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);
          const badge = label === "Messages" ? unreadMessages : 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] flex-1 py-2",
                isActive ? "text-accent" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-accent" />
              )}
              <div className="relative">
                <Icon size={20} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className="text-xs">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
