"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setNotificationSetting } from "@/server/actions/notifications";
import type { NotificationChannel, NotificationType } from "@/server/actions/notifications";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const CHANNELS: { key: NotificationChannel; label: string }[] = [
  { key: "in_app", label: "In-app" },
  { key: "email", label: "Email" },
  { key: "push", label: "Push" },
];

const GROUPS: {
  label: string;
  rows: { type: NotificationType; label: string }[];
}[] = [
  {
    label: "Connections",
    rows: [
      { type: "connection_request", label: "Connection request" },
      { type: "connection_accepted", label: "Connection accepted" },
      { type: "match_found", label: "Match found" },
    ],
  },
  {
    label: "Chaburas",
    rows: [
      { type: "chabura_invite", label: "Chabura invite" },
      { type: "chabura_request", label: "Join request" },
    ],
  },
  {
    label: "Sessions",
    rows: [
      { type: "session_invite", label: "Session invite" },
      { type: "session_starting_soon", label: "Starting soon (15 min)" },
      { type: "session_starting_now", label: "Starting now" },
      { type: "session_cancelled", label: "Session cancelled" },
    ],
  },
  {
    label: "Messages",
    rows: [{ type: "message_received", label: "New message" }],
  },
];

interface NotificationSettingsProps {
  // Set of "{type}_{channel}" keys that are explicitly disabled
  disabledKeys: string[];
}

export function NotificationSettings({ disabledKeys }: NotificationSettingsProps) {
  const [, startTransition] = useTransition();
  const [disabled, setDisabled] = useState<Set<string>>(() => new Set(disabledKeys));

  function isEnabled(type: NotificationType, channel: NotificationChannel) {
    return !disabled.has(`${type}_${channel}`);
  }

  function handleToggle(type: NotificationType, channel: NotificationChannel, next: boolean) {
    const key = `${type}_${channel}`;
    // Optimistically update local state immediately
    setDisabled((prev) => {
      const updated = new Set(prev);
      if (next) updated.delete(key);
      else updated.add(key);
      return updated;
    });
    startTransition(async () => {
      const result = await setNotificationSetting(type, channel, next);
      if (!result.success) {
        // Revert on failure
        setDisabled((prev) => {
          const updated = new Set(prev);
          if (next) updated.add(key);
          else updated.delete(key);
          return updated;
        });
        toast.error(result.error ?? "Failed to save");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Channel header row */}
        <div className="grid grid-cols-[1fr_repeat(3,3rem)] gap-x-2 items-center">
          <span />
          {CHANNELS.map((ch) => (
            <span key={ch.key} className="text-center text-xs font-medium text-muted-foreground">
              {ch.label}
            </span>
          ))}
        </div>

        {GROUPS.map((group, gi) => (
          <div key={group.label} className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pb-1">
              {group.label}
            </p>
            {group.rows.map((row) => (
              <div
                key={row.type}
                className="grid grid-cols-[1fr_repeat(3,3rem)] gap-x-2 items-center rounded-md px-1 py-2 hover:bg-accent/40 transition-colors"
              >
                <span className="text-sm">{row.label}</span>
                {CHANNELS.map((ch) => (
                  <div key={ch.key} className="flex justify-center">
                    <Switch
                      checked={isEnabled(row.type, ch.key)}
                      onCheckedChange={(checked) => handleToggle(row.type, ch.key, checked)}
                      aria-label={`${row.label} — ${ch.label}`}
                    />
                  </div>
                ))}
              </div>
            ))}
            {gi < GROUPS.length - 1 && <Separator className="mt-3" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
