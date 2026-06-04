"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Public Profile", href: "/settings/public-profile" },
  { label: "Location", href: "/settings/location" },
  { label: "Notifications", href: "/settings/notifications" },
  { label: "Learning Profiles", href: "/settings/learning-profiles" },
  { label: "Account ID", href: "/settings/account-id" },
  { type: "divider" as const },
  { label: "Email", href: "/settings/email" },
  { label: "Password", href: "/settings/password" },
  { label: "Connected Accounts", href: "/settings/accounts" },
  { type: "divider" as const },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: horizontal scrollable tabs */}
      <nav className="md:hidden flex gap-1 overflow-x-auto pb-1 border-b border-border scrollbar-none">
        {NAV_ITEMS.map((item, i) => {
          if ("type" in item) return null;
          const active = pathname === item.href;
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
            </Link>
          );
        })}
      </nav>

      {/* Desktop: vertical sidebar */}
      <nav className="hidden md:flex flex-col w-48 shrink-0 gap-0.5">
        {NAV_ITEMS.map((item, i) => {
          if ("type" in item) {
            return <div key={i} className="my-1.5 border-t border-border" />;
          }
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
