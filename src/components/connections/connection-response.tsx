"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { respondToConnection } from "@/server/actions/connections";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ConnectionResponseProps {
  connectionId: string;
}

export function ConnectionResponse({ connectionId }: ConnectionResponseProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);
  const [showBeis, setShowBeis] = useState(false);

  async function handleRespond(status: "accepted" | "declined") {
    setLoading(status === "accepted" ? "accept" : "decline");
    const result = await respondToConnection(connectionId, status);
    if (result.success) {
      if (status === "accepted") {
        // Confetti burst + ב flash — the moment of delight (spec §3.6)
        fireConfetti();
        setShowBeis(true);
        setTimeout(() => setShowBeis(false), 700);
        toast.success("Connection accepted! Time to learn together.");
      } else {
        toast.success("Request declined.");
      }
      router.refresh();
    } else {
      toast.error(result.error ?? "Something went wrong");
    }
    setLoading(null);
  }

  return (
    <>
      {/* ב flash overlay */}
      {showBeis && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <span
            className="text-[12rem] text-accent animate-ping"
            style={{ animationDuration: "700ms", animationIterationCount: 1 }}
          >
            ב
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          className="gap-1.5 bg-accent text-white hover:bg-accent/90"
          disabled={loading !== null}
          onClick={() => handleRespond("accepted")}
        >
          {loading === "accept" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={loading !== null}
          onClick={() => handleRespond("declined")}
        >
          {loading === "decline" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          Decline
        </Button>
      </div>
    </>
  );
}

function fireConfetti() {
  import("canvas-confetti").then(({ default: confetti }) => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.55 },
      colors: ["#E8703A", "#0E2A47", "#FBF6EC", "#F2E8D5", "#2F7D5B"],
    });
  });
}
