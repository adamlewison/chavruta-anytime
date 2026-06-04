import { AppHeader } from "@/components/layout/app-header";
import { BottomTabs } from "@/components/layout/bottom-tabs";
import { DesktopTopNav } from "@/components/layout/desktop-top-nav";
import { PollProvider } from "@/components/layout/poll-provider";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <PollProvider />
      {/* Desktop top nav */}
      <DesktopTopNav />

      {/* Mobile header */}
      <div className="md:hidden">
        <AppHeader />
      </div>

      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom tabs */}
      <BottomTabs />
    </div>
  );
}
