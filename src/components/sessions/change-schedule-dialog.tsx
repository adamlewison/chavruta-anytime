"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RRuleBuilder } from "@/components/sessions/rrule-builder";
import { updateSessionSchedule } from "@/server/actions/sessions";
import { toast } from "sonner";

interface ChangeScheduleDialogProps {
  sessionId: string;
  timezone: string;
  durationMin: number;
}

export function ChangeScheduleDialog({
  sessionId,
  timezone,
  durationMin: initialDurationMin,
}: ChangeScheduleDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [schedule, setSchedule] = useState<{
    rrule: string;
    dtstart: string;
    timezone: string;
  } | null>(null);
  const [durationHours, setDurationHours] = useState(
    Math.floor(initialDurationMin / 60),
  );
  const [durationMins, setDurationMins] = useState(initialDurationMin % 60);
  const [saving, setSaving] = useState(false);

  function handleOpen() {
    setDurationHours(Math.floor(initialDurationMin / 60));
    setDurationMins(initialDurationMin % 60);
    setSchedule(null);
    setOpen(true);
  }

  async function handleSave() {
    if (!schedule) return;
    const durationMin = durationHours * 60 + durationMins;
    if (durationMin <= 0) {
      toast.error("Duration must be greater than 0");
      return;
    }
    setSaving(true);
    const result = await updateSessionSchedule({
      sessionId,
      rrule: schedule.rrule,
      dtstart: schedule.dtstart,
      timezone: schedule.timezone,
      durationMin,
    });
    setSaving(false);
    if (result.success) {
      toast.success("Schedule updated");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update schedule");
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="flex flex-col h-auto py-3 gap-1 w-full"
        onClick={handleOpen}
      >
        <CalendarDays className="h-4 w-4" />
        <span className="text-xs">Change Schedule</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Schedule</DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-6">
            <RRuleBuilder value={schedule} onChange={setSchedule} timezone={timezone} />

            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    value={durationHours}
                    onChange={(e) =>
                      setDurationHours(Math.max(0, Number(e.target.value)))
                    }
                    className="w-16 border-0 border-b rounded-none px-0 focus-visible:ring-0 shadow-none text-center"
                  />
                  <span className="text-sm text-muted-foreground">hr</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={durationMins}
                    onChange={(e) =>
                      setDurationMins(
                        Math.min(59, Math.max(0, Number(e.target.value))),
                      )
                    }
                    className="w-16 border-0 border-b rounded-none px-0 focus-visible:ring-0 shadow-none text-center"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !schedule}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
