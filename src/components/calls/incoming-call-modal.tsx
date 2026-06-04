"use client";

import { Phone, X } from "lucide-react";

export function IncomingCallModal({
  chaburaName,
  onJoin,
  onDismiss,
}: {
  chaburaName: string;
  onJoin: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-lg w-72">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <Phone className="h-5 w-5 text-green-600 dark:text-green-400 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Active call</p>
        <p className="text-xs text-muted-foreground truncate">{chaburaName}</p>
        <div className="mt-2 flex gap-2">
          <button
            onClick={onJoin}
            className="flex-1 rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 transition-colors"
          >
            Join
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/70 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
