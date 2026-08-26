"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GridPicker } from "@/components/availability/grid-picker";
import { popcountHours } from "@/domain/availability";
import type { SubjectOption } from "@/server/actions/study-profiles";
import { cn } from "@/lib/utils";

interface StudyProfileFormFieldsProps {
  subjects: SubjectOption[];
  subjectId: string;
  bitmap: Uint8Array;
  notes: string;
  timezone: string;
  compact?: boolean;
  onSubjectChange: (subjectId: string) => void;
  onBitmapChange: (bitmap: Uint8Array) => void;
  onNotesChange: (notes: string) => void;
}

export function StudyProfileFormFields({
  subjects,
  subjectId,
  bitmap,
  notes,
  timezone,
  compact = false,
  onSubjectChange,
  onBitmapChange,
  onNotesChange,
}: StudyProfileFormFieldsProps) {
  const hours = popcountHours(bitmap);
  const labelClassName = cn(compact && "text-xs text-muted-foreground");

  return (
    <>
      {/* Subject */}
      <div className="space-y-1.5">
        <Label className={labelClassName}>Subject</Label>
        <Select value={subjectId} onValueChange={onSubjectChange}>
          <SelectTrigger className={compact ? "h-9" : undefined}>
            <SelectValue placeholder="Pick a subject…" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {!compact && s.hebrewName ? ` · ${s.hebrewName}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Availability */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className={labelClassName}>Availability</Label>
          <span
            className={cn(
              "text-xs tabular-nums font-semibold",
              hours > 0 ? "text-accent" : "text-muted-foreground",
            )}
          >
            {hours} hr{hours !== 1 ? "s" : ""}/week
          </span>
        </div>
        <GridPicker
          value={bitmap}
          onChange={onBitmapChange}
          timezone={timezone}
          showFooter={false}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className={labelClassName}>
          Notes{" "}
          <span className="font-normal text-muted-foreground text-xs">
            (optional)
          </span>
        </Label>
        <Textarea
          rows={2}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="e.g. Looking for a beginner-friendly chavruta…"
        />
      </div>
    </>
  );
}
