"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cancelOccurrence, saveOccurrenceNotes } from "@/server/actions/sessions";
import { toast } from "sonner";
import { Loader2, X, Save } from "lucide-react";

interface OccurrenceActionsProps {
  occurrenceId: string;
  sessionId: string;
  initialNotes: string;
  notesEditable: boolean;
  isOwner: boolean;
  status: "scheduled" | "cancelled" | "completed" | "missed";
}

export function OccurrenceActions({
  occurrenceId,
  sessionId,
  initialNotes,
  notesEditable,
  isOwner,
  status,
}: OccurrenceActionsProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [savingNotes, setSavingNotes] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleSaveNotes() {
    setSavingNotes(true);
    const result = await saveOccurrenceNotes(occurrenceId, notes);
    if (result.success) {
      toast.success("Notes saved.");
    } else {
      toast.error(result.error ?? "Couldn't save notes — try again?");
    }
    setSavingNotes(false);
  }

  async function handleCancelOccurrence() {
    setCancelling(true);
    const result = await cancelOccurrence(occurrenceId);
    if (result.success) {
      toast.success("This occurrence has been cancelled.");
      router.push(`/sessions/${sessionId}`);
    } else {
      toast.error(result.error ?? "Couldn't cancel this occurrence — try again?");
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notesEditable ? (
            <>
              <Textarea
                placeholder="Add notes about this session…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={2000}
              />
              <Button
                size="sm"
                className="gap-2 bg-accent text-white hover:bg-accent/90"
                onClick={handleSaveNotes}
                disabled={savingNotes}
              >
                {savingNotes ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save Notes
              </Button>
            </>
          ) : notes ? (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {notes}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">No notes.</p>
          )}
        </CardContent>
      </Card>

      {/* Cancel this occurrence (owner only, when scheduled) */}
      {isOwner && status === "scheduled" && (
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={handleCancelOccurrence}
          disabled={cancelling}
        >
          {cancelling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Cancel Just This Occurrence
        </Button>
      )}
    </div>
  );
}
