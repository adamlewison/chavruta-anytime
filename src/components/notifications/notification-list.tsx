import { EmptyState } from "@/components/brand/empty-state";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";
import { NotificationLink } from "@/components/notifications/notification-link";
import { cn } from "@/lib/utils";
import { Bell, UserPlus, Users, Calendar, MessageSquare, Sparkles } from "lucide-react";

export type NotificationRow = {
  id: string;
  type: string;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date | null;
};

function notifIcon(type: string) {
  switch (type) {
    case "connection_request":
    case "connection_accepted":
      return <UserPlus className="h-4 w-4 text-accent" />;
    case "chabura_invite":
    case "chabura_request":
      return <Users className="h-4 w-4 text-accent" />;
    case "session_invite":
    case "session_starting_soon":
    case "session_starting_now":
    case "session_cancelled":
      return <Calendar className="h-4 w-4 text-accent" />;
    case "message_received":
      return <MessageSquare className="h-4 w-4 text-accent" />;
    case "match_found":
      return <Sparkles className="h-4 w-4 text-accent" />;
    default:
      return <Bell className="h-4 w-4 text-accent" />;
  }
}

function notifText(type: string, payload: unknown): string {
  const p = (payload ?? {}) as Record<string, string>;
  switch (type) {
    case "connection_request":
      return `${p.name ?? "Someone"} wants to connect with you`;
    case "connection_accepted":
      return `${p.name ?? "Someone"} accepted your connection request`;
    case "chabura_invite":
      return `You've been invited to join ${p.chaburaName ?? "a chabura"}`;
    case "chabura_request":
      return `${p.name ?? "Someone"} wants to join your chabura`;
    case "session_invite":
      return `You've been invited to a session: ${p.title ?? ""}`;
    case "session_starting_soon":
      return `${p.title ?? "A session"} starts in 10 minutes`;
    case "session_starting_now":
      return `${p.title ?? "A session"} is starting now`;
    case "session_cancelled":
      return `${p.title ?? "A session"} has been cancelled`;
    case "message_received":
      return `New message from ${p.name ?? "your chavruta"}`;
    case "match_found":
      return "We found a potential chavruta match for you!";
    default:
      return "New notification";
  }
}

function notifHref(type: string, payload: unknown): string {
  const p = (payload ?? {}) as Record<string, string>;
  switch (type) {
    case "connection_request":
    case "connection_accepted":
      return "/connections";
    case "chabura_invite":
    case "chabura_request":
      return p.chaburaSlug ? `/chaburas/${p.chaburaSlug}` : "/chaburas";
    case "session_invite":
    case "session_starting_soon":
    case "session_starting_now":
    case "session_cancelled":
      return p.sessionId ? `/sessions/${p.sessionId}` : "/dashboard";
    case "message_received":
      return p.conversationId ? `/messages/${p.conversationId}` : "/messages";
    case "match_found":
      return "/find";
    default:
      return "/dashboard";
  }
}

export function NotificationList({ notifs }: { notifs: NotificationRow[] }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Notifications
        </h1>
        {notifs.some((n) => !n.readAt) && <MarkAllReadButton />}
      </div>

      {notifs.length === 0 ? (
        <EmptyState
          heading="All caught up!"
          description="No new notifications."
          letter="נ"
        />
      ) : (
        <div className="divide-y border rounded-xl overflow-hidden bg-card">
          {notifs.map((n) => (
            <NotificationLink
              key={n.id}
              id={n.id}
              href={notifHref(n.type, n.payload)}
              unread={!n.readAt}
            >
              <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-accent/10">
                {notifIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", !n.readAt && "font-medium")}>
                  {notifText(n.type, n.payload)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(n.createdAt ?? new Date()).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {!n.readAt && (
                <div className="h-2 w-2 rounded-full bg-accent mt-1.5 shrink-0" />
              )}
            </NotificationLink>
          ))}
        </div>
      )}
    </div>
  );
}
