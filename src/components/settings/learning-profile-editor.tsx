"use client";

import type { Dispatch, SetStateAction } from "react";
import { Check, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { popcountHours } from "@/domain/availability";
import type { PresetKey } from "@/components/settings/learning-profile-bitmap";
import { LearningProfileAvailabilityStep } from "@/components/settings/learning-profile-availability-step";
import type { SubjectOption } from "@/server/actions/study-profiles";
import { cn } from "@/lib/utils";

export type EditorStep = 1 | 2 | 3;

export interface LearningProfileFormState {
  subjectId: string;
  bitmap: Uint8Array;
  notes: string;
  active: boolean;
}

const STEP_LABELS: Record<EditorStep, string> = {
  1: "Subject",
  2: "Availability",
  3: "Details",
};

const STEP_DESCRIPTIONS: Record<EditorStep, string> = {
  1: "Which subject would you like to study?",
  2: "When are you free to learn?",
  3: "Anything else to add?",
};

interface LearningProfileEditorProps {
  open: boolean;
  sheetMode: "add" | "edit";
  step: EditorStep;
  form: LearningProfileFormState;
  setForm: Dispatch<SetStateAction<LearningProfileFormState>>;
  subjects: SubjectOption[];
  timezone: string;
  isPending: boolean;
  closeSheet: () => void;
  goNext: () => void;
  goBack: () => void;
  applyBitmapPreset: (key: PresetKey) => void;
  handleSave: () => void;
}

export function LearningProfileEditor({
  open,
  sheetMode,
  step,
  form,
  setForm,
  subjects,
  timezone,
  isPending,
  closeSheet,
  goNext,
  goBack,
  applyBitmapPreset,
  handleSave,
}: LearningProfileEditorProps) {
  const selectedSubject = subjects.find((s) => s.id === form.subjectId);
  const hours = popcountHours(form.bitmap);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeSheet()}>
      <SheetContent
        className="sm:max-w-[540px] flex flex-col gap-0 p-0"
        showCloseButton={!isPending}
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0 gap-3">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {([1, 2, 3] as EditorStep[]).map((n) => (
              <div key={n} className="flex items-center gap-2 flex-1 last:flex-none">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all",
                    step === n
                      ? "bg-accent text-white shadow-sm"
                      : step > n
                        ? "bg-accent/20 text-accent"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {step > n ? <Check className="w-3.5 h-3.5" /> : n}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:block",
                    step === n ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {STEP_LABELS[n]}
                </span>
                {n < 3 && (
                  <div
                    className={cn(
                      "flex-1 h-px mx-1",
                      step > n ? "bg-accent/30" : "bg-border",
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          <div>
            <SheetTitle className="text-lg">{STEP_DESCRIPTIONS[step]}</SheetTitle>
            {step === 2 && selectedSubject && (
              <SheetDescription className="mt-0.5">
                for{" "}
                <span className="font-medium text-foreground">{selectedSubject.name}</span>
                {" · "}
                <span className="text-foreground">{timezone}</span>
              </SheetDescription>
            )}
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Step 1 — Subject */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-2.5">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, subjectId: s.id }))}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-all",
                    form.subjectId === s.id
                      ? "border-accent bg-accent/8 shadow-sm"
                      : "border-border hover:border-accent/40 hover:bg-muted/50",
                  )}
                >
                  <p className="font-semibold text-sm text-foreground leading-snug">
                    {s.name}
                  </p>
                  {s.hebrewName && (
                    <p className="text-xs text-muted-foreground mt-1">{s.hebrewName}</p>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 2 — Availability */}
          {step === 2 && (
            <LearningProfileAvailabilityStep
              bitmap={form.bitmap}
              timezone={timezone}
              onBitmapChange={(bitmap) => setForm((f) => ({ ...f, bitmap }))}
              applyBitmapPreset={applyBitmapPreset}
            />
          )}

          {/* Step 3 — Details */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="rounded-xl border bg-muted/40 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{selectedSubject?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {hours > 0
                      ? `${hours} hours/week available`
                      : "No availability set — you can still save and add it later"}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes">
                  Notes{" "}
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="e.g. Looking for a beginner-friendly chavruta, prefer text over audio…"
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Shown to potential learning partners.
                </p>
              </div>

              {/* Active toggle — edit mode only */}
              {sheetMode === "edit" && (
                <div className="rounded-xl border p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Profile active</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {form.active
                        ? "You appear in matching for this subject"
                        : "Paused — hidden from matching"}
                    </p>
                  </div>
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="px-6 py-4 border-t flex items-center gap-3 shrink-0">
          {step > 1 ? (
            <Button variant="outline" onClick={goBack} disabled={isPending} className="flex-1">
              Back
            </Button>
          ) : (
            <Button variant="outline" onClick={closeSheet} disabled={isPending} className="flex-1">
              Cancel
            </Button>
          )}

          {step < 3 ? (
            <Button onClick={goNext} className="flex-1">
              Continue
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isPending} className="flex-1">
              {isPending
                ? "Saving…"
                : sheetMode === "add"
                  ? "Create profile"
                  : "Save changes"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
