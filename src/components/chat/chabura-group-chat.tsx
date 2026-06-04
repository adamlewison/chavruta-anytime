"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { sendMessage, markConversationRead } from "@/server/actions/messages";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  senderId: string;
  senderName: string | null;
  body: string;
  createdAt: string;
}

interface ChaburaGroupChatProps {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
}

export function ChaburaGroupChat({
  conversationId,
  currentUserId,
  initialMessages,
}: ChaburaGroupChatProps) {
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: fetchedMessages } = useQuery<Message[]>({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/conversations/${conversationId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    initialData: initialMessages,
    staleTime: 0,
  });

  const serverIds = new Set((fetchedMessages ?? []).map((m) => m.id));
  const messages = [
    ...(fetchedMessages ?? []),
    ...optimisticMessages.filter((m) => !serverIds.has(m.id)),
  ];

  useEffect(() => {
    markConversationRead(conversationId).catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = body.trim();
      if (!text || sending) return;

      const optimisticMsg: Message = {
        id: `opt-${Date.now()}`,
        senderId: currentUserId,
        senderName: null,
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
      }
      setSending(false);
    },
    [body, sending, conversationId, currentUserId],
  );

  return (
    <div className="flex flex-col" style={{ height: "min(60vh, 500px)" }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2 px-1">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Start the conversation.
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={cn("flex", isMe ? "justify-end" : "justify-start")}
            >
              <div className="max-w-[75%] flex flex-col gap-0.5">
                {!isMe && (
                  <p className="text-[11px] font-medium text-muted-foreground px-1">
                    {msg.senderName ?? "Member"}
                  </p>
                )}
              <div
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm",
                  isMe
                    ? "bg-accent text-white rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm",
                )}
              >
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
                  })}
                </p>
              </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose bar */}
      <form
        onSubmit={handleSend}
        className="border-t pt-3 mt-auto"
      >
        <div className="flex items-center gap-2">
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            className="flex-1"
            disabled={sending}
            autoComplete="off"
            maxLength={1000}
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
