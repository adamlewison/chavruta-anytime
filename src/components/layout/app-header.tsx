import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { NotificationBell } from "@/components/layout/notification-bell";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/dashboard">
          <Logo size="sm" />
        </Link>

        <NotificationBell />
      </div>
    </header>
  );
}
