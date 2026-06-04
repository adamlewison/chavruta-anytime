"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreHorizontal, MessageSquare, UserMinus, X, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConnectionResponse } from "@/components/connections/connection-response";
import { removeConnection } from "@/server/actions/connections";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export type ConnectionRow = {
  id: string;
  otherId: string;
  otherName: string | null;
  otherImage: string | null;
  conversationId?: string | null;
};

function initials(name: string | null) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?"
  );
}


export function AcceptedConnectionsTable({ rows }: { rows: ConnectionRow[] }) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleRemove(connectionId: string) {
    setRemoving(connectionId);
    const result = await removeConnection(connectionId);
    if (result.success) {
      toast.success("Connection removed.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Something went wrong");
    }
    setRemoving(null);
  }

  return (
    <div className="rounded-lg border overflow-hidden divide-y divide-border">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarImage src={row.otherImage ?? undefined} />
              <AvatarFallback className="text-sm">{initials(row.otherName)}</AvatarFallback>
            </Avatar>
            <Link
              href={`/profile/${row.otherId}`}
              className="font-medium truncate hover:underline underline-offset-2"
            >
              {row.otherName ?? "Partner"}
            </Link>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {row.conversationId && (
                <DropdownMenuItem asChild>
                  <Link href={`/messages/${row.conversationId}`} className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="flex items-center gap-2 text-destructive focus:text-destructive"
                disabled={removing === row.id}
                onClick={() => handleRemove(row.id)}
              >
                {removing === row.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserMinus className="h-4 w-4" />
                )}
                Remove connection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}

export function PendingReceivedTable({ rows }: { rows: ConnectionRow[] }) {
  return (
    <div className="rounded-lg border overflow-hidden divide-y divide-border">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarImage src={row.otherImage ?? undefined} />
              <AvatarFallback className="text-sm">{initials(row.otherName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Link
                href={`/profile/${row.otherId}`}
                className="font-medium hover:underline underline-offset-2 block truncate"
              >
                {row.otherName ?? "Someone"}
              </Link>
              <p className="text-xs text-muted-foreground">wants to learn with you</p>
            </div>
          </div>
          <ConnectionResponse connectionId={row.id} />
        </div>
      ))}
    </div>
  );
}

export function PendingSentTable({ rows }: { rows: ConnectionRow[] }) {
  const router = useRouter();
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  async function handleWithdraw(connectionId: string) {
    setWithdrawing(connectionId);
    const result = await removeConnection(connectionId);
    if (result.success) {
      toast.success("Request withdrawn.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Something went wrong");
    }
    setWithdrawing(null);
  }

  return (
    <div className="rounded-lg border overflow-hidden divide-y divide-border">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarImage src={row.otherImage ?? undefined} />
              <AvatarFallback className="text-sm">{initials(row.otherName)}</AvatarFallback>
            </Avatar>
            <Link
              href={`/profile/${row.otherId}`}
              className="font-medium truncate hover:underline underline-offset-2"
            >
              {row.otherName ?? "Partner"}
            </Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary">Pending</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                  disabled={withdrawing === row.id}
                  onClick={() => handleWithdraw(row.id)}
                >
                  {withdrawing === row.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Withdraw request
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
