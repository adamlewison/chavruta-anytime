"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelSession } from "@/server/actions/sessions";
import { toast } from "sonner";

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Cancel this session series? This cannot be undone.")) return;
    setLoading(true);
    const result = await cancelSession(sessionId);
    setLoading(false);
    if (result.success) {
      toast.success("Session cancelled");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to cancel session");
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive shrink-0"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
