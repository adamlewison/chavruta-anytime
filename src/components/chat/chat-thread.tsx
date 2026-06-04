"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, ChevronLeft } from "lucide-react";
import { sendMessage, markConversationRead } from "@/server/actions/messages";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface Message {
  id: string;
  senderId: string;
  senderName?: string | null;
  body: string;
  createdAt: string;
}

interface ChatThreadProps {
  conversationId: string;
  currentUserId: string;
  otherUser: { name: string | null; image: string | null; profileHref: string | null };
  isChabura?: boolean;
  initialMessages: Message[];
}

export function ChatThread({
  conversationId,
  currentUserId,
  otherUser,
  isChabura = false,
  initialMessages,
}: ChatThreadProps) {
  const queryClient = useQueryClient();
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const queryKey = ["messages", conversationId];

  // Poll for new messages every 3 seconds so incoming messages appear in real time
  const { data: fetchedMessages } = useQuery<Message[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/messages/conversations/${conversationId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    initialData: initialMessages,
    staleTime: 0,
    refetchInterval: 3000,
  });

  // Merge server messages + local optimistic ones not yet confirmed
  const serverIds = new Set((fetchedMessages ?? []).map((m) => m.id));
  const messages = [
    ...(fetchedMessages ?? []),
    ...optimisticMessages.filter((m) => !serverIds.has(m.id)),
  ];

  // Mark read on mount and when conversation changes
  useEffect(() => {
    markConversationRead(conversationId).catch(() => {});
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = useCallback(
    async (e: React.BaseSyntheticEvent) => {
      e.preventDefault();
      const text = body.trim();
      if (!text || sending) return;

      const optimisticMsg: Message = {
        id: `opt-${Date.now()}`,
        senderId: currentUserId,
        body: text,
        createdAt: new Date().toISOString(),
      };
      setOptimisticMessages((prev) => [...prev, optimisticMsg]);
      setBody("");
      setSending(true);

      const result = await sendMessage(conversationId, text);
      if (!result.success) {
        toast.error("Couldn't send that message — try again?");
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        setBody(text);
      } else {
        // Wait for the refetch to complete before dropping the optimistic copy —
        // this prevents a flash where neither version is visible
        await queryClient.invalidateQueries({ queryKey });
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      }
      setSending(false);
    },
    [body, sending, conversationId, currentUserId],
  );

  const otherInitials =
    otherUser.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3 bg-background/80 backdrop-blur-sm shrink-0">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 -ml-2">
          <Link href="/messages">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        {otherUser.profileHref ? (
          <Link href={otherUser.profileHref} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Avatar className="h-8 w-8">
              <AvatarImage src={otherUser.image ?? undefined} />
              <AvatarFallback className="text-xs">{otherInitials}</AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium">{otherUser.name ?? "Partner"}</p>
          </Link>
        ) : (
          <>
            <Avatar className="h-8 w-8">
              <AvatarImage src={otherUser.image ?? undefined} />
              <AvatarFallback className="text-xs">{otherInitials}</AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium">{otherUser.name ?? "Partner"}</p>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">
            No messages yet. Say Shalom! 👋
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={cn("flex", isMe ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  isMe
                    ? "bg-accent text-white rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm",
                )}
              >
                {isChabura && !isMe && msg.senderName && (
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                    {msg.senderName}
                  </p>
                )}
                <p>{msg.body}</p>
                <p
                  className={cn(
                    "text-[10px] mt-0.5",
                    isMe ? "text-white/60 text-right" : "text-muted-foreground",
                  )}
                >
                  {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose bar */}
      <form
        onSubmit={handleSend}
        className="border-t px-4 py-3 shrink-0 bg-background"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-2">
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            className="flex-1"
            disabled={sending}
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!body.trim() || sending}
            className="bg-accent text-white hover:bg-accent/90 shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
