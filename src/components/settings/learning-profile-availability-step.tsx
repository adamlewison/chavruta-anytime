"use client";

import { GridPicker } from "@/components/availability/grid-picker";
import { popcountHours } from "@/domain/availability";
import { PRESETS, type PresetKey } from "@/components/settings/learning-profile-bitmap";
import { cn } from "@/lib/utils";

interface LearningProfileAvailabilityStepProps {
  bitmap: Uint8Array;
  timezone: string;
  onBitmapChange: (bitmap: Uint8Array) => void;
  applyBitmapPreset: (key: PresetKey) => void;
}

export function LearningProfileAvailabilityStep({
  bitmap,
  timezone,
  onBitmapChange,
  applyBitmapPreset,
}: LearningProfileAvailabilityStepProps) {
  const hours = popcountHours(bitmap);

  return (
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
        value={bitmap}
        onChange={onBitmapChange}
        timezone={timezone}
        showFooter={false}
      />

      <p className="text-xs text-muted-foreground text-center">
        Don&apos;t worry about being exact — we match on approximate overlap.
      </p>
    </div>
  );
}
