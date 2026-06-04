"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { sendConnectionRequest, removeConnection } from "@/server/actions/connections";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus, MessageSquare, Check, UserMinus, MoreVertical } from "lucide-react";

type ConnectionState = "none" | "pending_sent" | "pending_received" | "accepted";

interface ConnectButtonProps {
  userId: string;
  userName: string | null;
  initialState?: ConnectionState;
  connectionId?: string;
  conversationId?: string;
}

export function ConnectButton({
  userId,
  userName,
  initialState = "none",
  connectionId,
  conversationId,
}: ConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [state, setState] = useState<ConnectionState>(initialState);

  const handleRemove = async () => {
    if (!connectionId) return;
    setIsRemoving(true);
    try {
      const result = await removeConnection(connectionId);
      if (result.success) {
        setState("none");
        toast.success("Connection removed");
      } else {
        toast.error(result.error || "Couldn't remove connection — try again?");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await sendConnectionRequest(userId);
      if (result.success) {
        setState("pending_sent");
        toast.success(`Request sent to ${userName || "user"}!`);
      } else {
        toast.error(result.error || "Couldn't send request — try again?");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsConnecting(false);
    }
  };

  let actionBar;
  if (state === "accepted") {
    actionBar = (
      <div className="flex gap-2">
        <Button asChild className="gap-2" size="lg" variant="outline">
          <Link href={conversationId ? `/messages/${conversationId}` : "/messages"}>
            <MessageSquare className="h-4 w-4" />
            Message
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" variant="outline" className="px-3">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-destructive focus:text-destructive gap-2"
            >
              <UserMinus className="h-4 w-4" />
              {isRemoving ? "Removing…" : "Remove Connection"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  } else if (state === "pending_sent") {
    actionBar = (
      <Button disabled className="w-full gap-2" size="lg" variant="outline">
        <Check className="h-4 w-4" />
        Request Sent
      </Button>
    );
  } else if (state === "pending_received") {
    actionBar = (
      <Button disabled className="w-full gap-2" size="lg" variant="outline">
        They&apos;ve requested to connect with you — check Connections
      </Button>
    );
  } else {
    actionBar = (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full gap-2 bg-accent text-white hover:bg-accent/90"
        size="lg"
      >
        <UserPlus className="h-4 w-4" />
        {isConnecting ? "Sending…" : "Send Connection Request"}
      </Button>
    );
  }

  return <div>{actionBar}</div>;
}
