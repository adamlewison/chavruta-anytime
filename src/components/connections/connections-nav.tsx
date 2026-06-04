"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Chavrutas", href: "/connections/chavrutas" },
  { label: "Chaburas", href: "/connections/chaburas" },
] as const;

export function ConnectionsNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: horizontal scrollable tabs */}
      <nav className="md:hidden flex gap-1 overflow-x-auto pb-1 border-b border-border scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              {item.label === "Chavrutas" && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white text-[10px] font-semibold">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Desktop: vertical sidebar */}
      <nav className="hidden md:flex flex-col w-40 shrink-0 gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              {item.label}
              {item.label === "Chavrutas" && pendingCount > 0 && (
                <span className={cn(
                  "inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold",
                  active ? "bg-accent-foreground text-accent" : "bg-accent text-white",
                )}>
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
