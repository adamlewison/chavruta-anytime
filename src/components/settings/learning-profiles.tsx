"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createEmptyBitmap, popcountHours } from "@/domain/availability";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  bitmapToString,
  stringToBitmap,
  computeUtcString,
  type PresetKey,
  buildPresetBitmap,
} from "@/components/settings/learning-profile-bitmap";
import {
  LearningProfileEditor,
  type EditorStep,
  type LearningProfileFormState,
} from "@/components/settings/learning-profile-editor";
import {
  createStudyProfile,
  updateStudyProfile,
  deleteStudyProfile,
} from "@/server/actions/study-profiles";
import type { StudyProfileRow, SubjectOption } from "@/server/actions/study-profiles";

function emptyForm(): LearningProfileFormState {
  return { subjectId: "", bitmap: createEmptyBitmap(), notes: "", active: true };
}

function profileToForm(p: StudyProfileRow): LearningProfileFormState {
  return {
    subjectId: p.subjectId,
    bitmap: stringToBitmap(p.availabilityLocal),
    notes: p.notes ?? "",
    active: p.active,
  };
}

interface LearningProfilesProps {
  profiles: StudyProfileRow[];
  subjects: SubjectOption[];
  timezone: string;
}

export function LearningProfiles({
  profiles,
  subjects,
  timezone,
}: LearningProfilesProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<EditorStep>(1);
  const [sheetMode, setSheetMode] = useState<"add" | "edit">("add");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<LearningProfileFormState>(emptyForm());
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
    setStep((s) => Math.min(s + 1, 3) as EditorStep);
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1) as EditorStep);
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
        toast.success(
          sheetMode === "add" ? "Learning profile created" : "Profile updated",
        );
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

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Learning Profiles</CardTitle>
          <p className="text-xs text-muted-foreground">
            A learning profile tells us what you want to learn and when
            you&apos;re available, so we can find you the right chavruta.
          </p>
        </div>
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
            <p className="text-sm font-medium text-foreground">
              No learning profiles yet
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Hrs / week</TableHead>
                <TableHead className="w-[1%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => {
                const rowHours = popcountHours(
                  stringToBitmap(p.availabilityLocal),
                );
                const isConfirming = confirmDeleteId === p.id;

                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.subjectName}</span>
                        {!p.active && (
                          <Badge variant="secondary" className="text-xs">
                            Paused
                          </Badge>
                        )}
                      </div>
                      {p.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                          {p.notes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {rowHours > 0 ? rowHours : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isConfirming ? (
                          <>
                            <span className="text-xs text-muted-foreground mr-1">
                              Delete?
                            </span>
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <LearningProfileEditor
        open={open}
        sheetMode={sheetMode}
        step={step}
        form={form}
        setForm={setForm}
        subjects={subjects}
        timezone={timezone}
        isPending={isPending}
        closeSheet={closeSheet}
        goNext={goNext}
        goBack={goBack}
        applyBitmapPreset={applyBitmapPreset}
        handleSave={handleSave}
      />
    </Card>
  );
}
