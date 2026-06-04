"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { GridPicker } from "@/components/availability/grid-picker";
import {
  getBit,
  setBit,
  createEmptyBitmap,
  expandToUtcWeek,
  getNextSundayUtc,
  popcountHours,
} from "@/lib/availability";
import {
  createStudyProfile,
  updateStudyProfile,
  deleteStudyProfile,
} from "@/server/actions/study-profiles";
import type { StudyProfileRow, SubjectOption } from "@/server/actions/study-profiles";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────

function bitmapToString(bitmap: Uint8Array): string {
  let s = "";
  for (let i = 0; i < 336; i++) s += getBit(bitmap, i) ? "1" : "0";
  return s;
}

function stringToBitmap(s: string): Uint8Array {
  const bitmap = createEmptyBitmap();
  for (let i = 0; i < Math.min(s.length, 336); i++) {
    if (s[i] === "1") setBit(bitmap, i);
  }
  return bitmap;
}

function computeUtcString(bitmap: Uint8Array, timezone: string): string {
  const utcBitmap = expandToUtcWeek(bitmap, timezone, getNextSundayUtc());
  return bitmapToString(utcBitmap);
}

const SLOTS_PER_DAY = 48;

type PresetKey = "weekday-evenings" | "weekday-mornings" | "late-night" | "clear";

const PRESETS: { key: PresetKey; label: string; description: string }[] = [
  { key: "weekday-evenings", label: "Weekday evenings", description: "Mon–Fri, 7–10pm" },
  { key: "weekday-mornings", label: "Weekday mornings", description: "Mon–Fri, 6–9am" },
  { key: "late-night", label: "Late night", description: "Daily, 10–11pm" },
];

function buildPresetBitmap(key: PresetKey): Uint8Array {
  const bitmap = createEmptyBitmap();
  if (key === "weekday-evenings") {
    for (let day = 1; day <= 5; day++)
      for (let slot = 38; slot <= 43; slot++)
        setBit(bitmap, day * SLOTS_PER_DAY + slot);
  } else if (key === "weekday-mornings") {
    for (let day = 1; day <= 5; day++)
      for (let slot = 12; slot <= 17; slot++)
        setBit(bitmap, day * SLOTS_PER_DAY + slot);
  } else if (key === "late-night") {
    for (let day = 0; day < 7; day++)
      for (let slot = 44; slot <= 46; slot++)
        setBit(bitmap, day * SLOTS_PER_DAY + slot);
  }
  return bitmap;
}

// ── Types ────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "Subject",
  2: "Availability",
  3: "Details",
};

const STEP_DESCRIPTIONS: Record<Step, string> = {
  1: "Which subject would you like to study?",
  2: "When are you free to learn?",
  3: "Anything else to add?",
};

interface FormState {
  subjectId: string;
  bitmap: Uint8Array;
  notes: string;
  active: boolean;
}

function emptyForm(): FormState {
  return { subjectId: "", bitmap: createEmptyBitmap(), notes: "", active: true };
}

function profileToForm(p: StudyProfileRow): FormState {
  return {
    subjectId: p.subjectId,
    bitmap: stringToBitmap(p.availabilityLocal),
    notes: p.notes ?? "",
    active: p.active,
  };
}

// ── Component ────────────────────────────────────────────────────────────

interface LearningProfilesProps {
  profiles: StudyProfileRow[];
  subjects: SubjectOption[];
  timezone: string;
}

export function LearningProfiles({ profiles, subjects, timezone }: LearningProfilesProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [sheetMode, setSheetMode] = useState<"add" | "edit">("add");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openAdd() {
    setForm(emptyForm());
    setStep(1);
    setSheetMode("add");
    setEditId(null);
    setOpen(true);
  }

  function openEdit(profile: StudyProfileRow) {
    setForm(profileToForm(profile));
    setStep(1);
    setSheetMode("edit");
    setEditId(profile.id);
    setOpen(true);
  }

  function closeSheet() {
    if (!isPending) setOpen(false);
  }

  function goNext() {
    if (step === 1 && !form.subjectId) {
      toast.error("Please pick a subject first");
      return;
    }
    setStep((s) => Math.min(s + 1, 3) as Step);
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1) as Step);
  }

  function applyBitmapPreset(key: PresetKey) {
    setForm((f) => ({ ...f, bitmap: buildPresetBitmap(key) }));
  }

  function handleSave() {
    const availabilityLocal = bitmapToString(form.bitmap);
    const availabilityUtc = computeUtcString(form.bitmap, timezone);

    startTransition(async () => {
      let result;
      if (sheetMode === "add") {
        result = await createStudyProfile({
          subjectId: form.subjectId,
          availabilityLocal,
          availabilityUtc,
          notes: form.notes,
        });
      } else {
        result = await updateStudyProfile({
          id: editId!,
          subjectId: form.subjectId,
          availabilityLocal,
          availabilityUtc,
          notes: form.notes,
          active: form.active,
        });
      }

      if (result.success) {
        toast.success(sheetMode === "add" ? "Learning profile created" : "Profile updated");
        setOpen(false);
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteStudyProfile(id);
      setConfirmDeleteId(null);
      if (result.success) {
        toast.success("Profile deleted");
      } else {
        toast.error(result.error ?? "Failed to delete");
      }
    });
  }

  const selectedSubject = subjects.find((s) => s.id === form.subjectId);
  const hours = popcountHours(form.bitmap);

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Learning Profiles</CardTitle>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Add profile
        </Button>
      </CardHeader>

      <CardContent>
        {profiles.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No learning profiles yet</p>
            <p className="text-xs text-muted-foreground">
              Add a profile to get matched with a chavruta for a specific subject.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {profiles.map((p) => {
              const rowHours = popcountHours(stringToBitmap(p.availabilityLocal));
              const isConfirming = confirmDeleteId === p.id;

              return (
                <div key={p.id} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-accent" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{p.subjectName}</span>
                      {!p.active && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          Paused
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {rowHours > 0 ? `${rowHours} hrs/week` : "No availability set"}
                      {p.notes && ` · ${p.notes}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isConfirming ? (
                      <>
                        <span className="text-xs text-muted-foreground mr-1">Delete?</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => handleDelete(p.id)}
                          disabled={isPending}
                        >
                          Yes
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isPending}
                        >
                          No
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setConfirmDeleteId(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* ── Sheet ─────────────────────────────────────────────────────── */}
      <Sheet open={open} onOpenChange={(o) => !o && closeSheet()}>
        <SheetContent
          className="sm:max-w-[540px] flex flex-col gap-0 p-0"
          showCloseButton={!isPending}
        >
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0 gap-3">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {([1, 2, 3] as Step[]).map((n) => (
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
              <div className="space-y-4">
                {/* Hours counter */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Click or drag cells to mark free times
                  </p>
                  <div
                    className={cn(
                      "text-sm font-semibold tabular-nums transition-colors",
                      hours > 0 ? "text-accent" : "text-muted-foreground",
                    )}
                  >
                    {hours} hr{hours !== 1 ? "s" : ""}/week
                  </div>
                </div>

                {/* Quick presets */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Quick start
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => applyBitmapPreset(p.key)}
                        className="group flex flex-col items-start rounded-lg border border-border bg-muted/40 px-3 py-2 text-left transition-colors hover:border-accent/50 hover:bg-accent/8"
                      >
                        <span className="text-xs font-medium text-foreground group-hover:text-accent">
                          {p.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{p.description}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => applyBitmapPreset("clear")}
                      className="flex items-center rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Grid */}
                <GridPicker
                  value={form.bitmap}
                  onChange={(bitmap) => setForm((f) => ({ ...f, bitmap }))}
                  timezone={timezone}
                  showFooter={false}
                />

                <p className="text-xs text-muted-foreground text-center">
                  Don&apos;t worry about being exact — we match on approximate overlap.
                </p>
              </div>
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
    </Card>
  );
}
