"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { sendConnectionRequest } from "@/server/actions/connections";
import { Button } from "@/components/ui/button";
import { UserPlus, MessageSquare, Check } from "lucide-react";

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
  const [state, setState] = useState<ConnectionState>(initialState);

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
      <div className="flex gap-3">
        <Button asChild className="flex-1 gap-2" size="lg" variant="outline">
          <Link href={conversationId ? `/messages/${conversationId}` : "/messages"}>
            <MessageSquare className="h-4 w-4" />
            Message
          </Link>
        </Button>
        <Button asChild className="flex-1 gap-2 bg-accent text-white hover:bg-accent/90" size="lg">
          <Link href={`/sessions/new?type=chavruta&with=${connectionId}`}>
            Schedule Session
          </Link>
        </Button>
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

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3 md:bottom-0">
      <div className="mx-auto max-w-2xl">{actionBar}</div>
    </div>
  );
}
