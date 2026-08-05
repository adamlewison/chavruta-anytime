"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  cancelOccurrence,
  rescheduleOccurrence,
  updateOccurrenceStatus,
} from "@/server/actions/session-occurrences";
import { toast } from "sonner";
import { Loader2, MoreHorizontal } from "lucide-react";
import { DateTime } from "luxon";

interface OccurrenceActionsProps {
  occurrenceId: string;
  sessionId: string;
  isOwner: boolean;
  status: "scheduled" | "cancelled" | "completed" | "missed";
  startsAt: string;
  timezone: string;
  durationMin: number;
}

export function OccurrenceActions({
  occurrenceId,
  sessionId,
  isOwner,
  status,
  startsAt,
  timezone,
  durationMin,
}: OccurrenceActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const localStart = DateTime.fromISO(startsAt).setZone(timezone);
  const [rescheduleDate, setRescheduleDate] = useState(
    localStart.toFormat("yyyy-MM-dd"),
  );
  const [rescheduleTime, setRescheduleTime] = useState(
    localStart.toFormat("HH:mm"),
  );

  async function handleStatusChange(
    newStatus: "scheduled" | "cancelled" | "completed" | "missed",
  ) {
    setBusy(true);
    const result = await updateOccurrenceStatus(occurrenceId, newStatus);
    if (result.success) {
      toast.success("Status updated.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Couldn't update status — try again?");
    }
    setBusy(false);
  }

  async function handleCancel() {
    setBusy(true);
    const result = await cancelOccurrence(occurrenceId);
    if (result.success) {
      toast.success("This occurrence has been cancelled.");
      router.push(`/sessions/${sessionId}`);
    } else {
      toast.error(result.error ?? "Couldn't cancel this occurrence — try again?");
      setBusy(false);
    }
  }

  async function handleReschedule() {
    const newStart = DateTime.fromFormat(
      `${rescheduleDate} ${rescheduleTime}`,
      "yyyy-MM-dd HH:mm",
      { zone: timezone },
    );
    if (!newStart.isValid) {
      toast.error("Invalid date or time.");
      return;
    }
    const newEnd = newStart.plus({ minutes: durationMin });

    setRescheduling(true);
    const result = await rescheduleOccurrence(
      occurrenceId,
      newStart.toUTC().toISO()!,
      newEnd.toUTC().toISO()!,
    );
    if (result.success) {
      toast.success("Occurrence rescheduled.");
      setRescheduleOpen(false);
      router.refresh();
    } else {
      toast.error(result.error ?? "Couldn't reschedule — try again?");
    }
    setRescheduling(false);
  }

  if (!isOwner) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={busy}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => handleStatusChange("scheduled")}
                disabled={status === "scheduled"}
              >
                Scheduled
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("completed")}
                disabled={status === "completed"}
              >
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("missed")}
                disabled={status === "missed"}
              >
                Missed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("cancelled")}
                disabled={status === "cancelled"}
              >
                Cancelled
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem onClick={() => setRescheduleOpen(true)}>
            Reschedule
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleCancel}
          >
            Cancel occurrence
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reschedule dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Occurrence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Start time{" "}
                <span className="text-muted-foreground font-normal">
                  ({timezone})
                </span>
              </label>
              <Input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Duration stays at {durationMin} minutes.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleOpen(false)}
              disabled={rescheduling}
            >
              Cancel
            </Button>
            <Button onClick={handleReschedule} disabled={rescheduling}>
              {rescheduling && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
