"use client";

import { ChevronDown, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { popcountHours } from "@/domain/availability";
import { stringToBitmap } from "@/components/settings/learning-profile-bitmap";
import { StudyProfileFormFields } from "@/components/matching/study-profile-form-fields";
import type { StudyProfileRow, SubjectOption } from "@/server/actions/study-profiles";
import { cn } from "@/lib/utils";

interface FormState {
  subjectId: string;
  bitmap: Uint8Array;
  notes: string;
  active: boolean;
}

interface StudyProfileListRowProps {
  profile: StudyProfileRow;
  subjects: SubjectOption[];
  timezone: string;
  isExpanded: boolean;
  isConfirmingDelete: boolean;
  isPending: boolean;
  form: FormState;
  onToggle: () => void;
  onPatchForm: (patch: Partial<FormState>) => void;
  onUpdate: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

export function StudyProfileListRow({
  profile,
  subjects,
  timezone,
  isExpanded,
  isConfirmingDelete,
  isPending,
  form,
  onToggle,
  onPatchForm,
  onUpdate,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: StudyProfileListRowProps) {
  const rowHours = popcountHours(stringToBitmap(profile.availabilityLocal));

  return (
    <div className="border-b last:border-b-0">
      {/* Clickable row */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full grid grid-cols-[1fr_80px_28px] items-center px-4 py-3.5 text-left transition-colors",
          isExpanded ? "bg-muted/30" : "hover:bg-muted/30",
          !profile.active && "opacity-60",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <BookOpen className="h-4 w-4 text-accent shrink-0" />
          <span className="text-sm font-medium truncate">{profile.subjectName}</span>
          {!profile.active && (
            <span className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">
              Paused
            </span>
          )}
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {rowHours > 0 ? `${rowHours}h` : "—"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      {/* Slide-down edit panel */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t bg-muted/20 px-4 pt-4 pb-5 space-y-4">
            <StudyProfileFormFields
              compact
              subjects={subjects}
              subjectId={form.subjectId}
              bitmap={form.bitmap}
              notes={form.notes}
              timezone={timezone}
              onSubjectChange={(v) => onPatchForm({ subjectId: v })}
              onBitmapChange={(bitmap) => onPatchForm({ bitmap })}
              onNotesChange={(notes) => onPatchForm({ notes })}
            />

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <span className="text-xs font-medium">
                {form.active
                  ? "Active — visible in matching"
                  : "Paused — hidden from matching"}
              </span>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => onPatchForm({ active: v })}
              />
            </div>

            {/* Row actions */}
            <div className="flex items-center gap-2 pt-1">
              {isConfirmingDelete ? (
                <>
                  <span className="text-xs text-muted-foreground mr-auto">
                    Delete this profile?
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onConfirmDelete}
                    disabled={isPending}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancelDelete}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={onRequestDelete}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                  <Button size="sm" className="ml-auto" onClick={onUpdate} disabled={isPending}>
                    {isPending ? "Saving…" : "Save changes"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
