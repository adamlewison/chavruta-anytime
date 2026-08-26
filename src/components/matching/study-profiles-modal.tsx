"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createEmptyBitmap } from "@/domain/availability";
import {
  bitmapToString,
  stringToBitmap,
  computeUtcString,
} from "@/components/settings/learning-profile-bitmap";
import { StudyProfileFormFields } from "@/components/matching/study-profile-form-fields";
import { StudyProfileListRow } from "@/components/matching/study-profile-list-row";
import {
  createStudyProfile,
  updateStudyProfile,
  deleteStudyProfile,
} from "@/server/actions/study-profiles";
import type { StudyProfileRow, SubjectOption } from "@/server/actions/study-profiles";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export interface StudyProfilesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: StudyProfileRow[];
  subjects: SubjectOption[];
  timezone: string;
}

export function StudyProfilesModal({
  open,
  onOpenChange,
  profiles,
  subjects,
  timezone,
}: StudyProfilesModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForms, setEditForms] = useState<Record<string, FormState>>({});
  const [createForm, setCreateForm] = useState<FormState>(emptyForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleRow(profile: StudyProfileRow) {
    if (expandedId === profile.id) {
      setExpandedId(null);
    } else {
      setExpandedId(profile.id);
      if (!editForms[profile.id]) {
        setEditForms((prev) => ({ ...prev, [profile.id]: profileToForm(profile) }));
      }
    }
  }

  function getEditForm(id: string): FormState {
    return editForms[id] ?? emptyForm();
  }

  function patchEditForm(id: string, patch: Partial<FormState>) {
    setEditForms((prev) => ({ ...prev, [id]: { ...getEditForm(id), ...patch } }));
  }

  function handleUpdate(id: string) {
    const form = getEditForm(id);
    const availabilityLocal = bitmapToString(form.bitmap);
    const availabilityUtc = computeUtcString(form.bitmap, timezone);
    startTransition(async () => {
      const result = await updateStudyProfile({
        id,
        subjectId: form.subjectId,
        availabilityLocal,
        availabilityUtc,
        notes: form.notes,
        active: form.active,
      });
      if (result.success) {
        toast.success("Profile updated");
        setExpandedId(null);
      } else {
        toast.error(result.error ?? "Failed to update");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteStudyProfile(id);
      setConfirmDeleteId(null);
      if (result.success) {
        toast.success("Profile deleted");
        if (expandedId === id) setExpandedId(null);
      } else {
        toast.error(result.error ?? "Failed to delete");
      }
    });
  }

  function handleCreate() {
    if (!createForm.subjectId) {
      toast.error("Please select a subject");
      return;
    }
    const availabilityLocal = bitmapToString(createForm.bitmap);
    const availabilityUtc = computeUtcString(createForm.bitmap, timezone);
    startTransition(async () => {
      const result = await createStudyProfile({
        subjectId: createForm.subjectId,
        availabilityLocal,
        availabilityUtc,
        notes: createForm.notes,
      });
      if (result.success) {
        toast.success("Study profile created");
        setCreateForm(emptyForm());
      } else {
        toast.error(result.error ?? "Failed to create");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Study Profiles</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── Profiles table ─────────────────────────────────────────── */}
          {profiles.length > 0 ? (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_28px] px-4 py-2 bg-muted/50 border-b">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Topic</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hrs / week</span>
              </div>

              {profiles.map((p) => (
                <StudyProfileListRow
                  key={p.id}
                  profile={p}
                  subjects={subjects}
                  timezone={timezone}
                  isExpanded={expandedId === p.id}
                  isConfirmingDelete={confirmDeleteId === p.id}
                  isPending={isPending}
                  form={getEditForm(p.id)}
                  onToggle={() => toggleRow(p)}
                  onPatchForm={(patch) => patchEditForm(p.id, patch)}
                  onUpdate={() => handleUpdate(p.id)}
                  onRequestDelete={() => setConfirmDeleteId(p.id)}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                  onConfirmDelete={() => handleDelete(p.id)}
                />
              ))}
            </div>
          ) : null}

          {/* ── Divider ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground">
              {profiles.length > 0 ? "Add new profile" : "Create your first profile"}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Create form ────────────────────────────────────────────── */}
          <div className="space-y-4 pb-2">
            <StudyProfileFormFields
              subjects={subjects}
              subjectId={createForm.subjectId}
              bitmap={createForm.bitmap}
              notes={createForm.notes}
              timezone={timezone}
              onSubjectChange={(v) => setCreateForm((f) => ({ ...f, subjectId: v }))}
              onBitmapChange={(bitmap) => setCreateForm((f) => ({ ...f, bitmap }))}
              onNotesChange={(notes) => setCreateForm((f) => ({ ...f, notes }))}
            />

            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={isPending || !createForm.subjectId}
            >
              {isPending ? "Saving…" : "Create profile"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
