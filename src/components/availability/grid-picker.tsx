"use client";

import { useCallback, useRef, useState } from "react";
import { getBit, setBit, clearBit, createEmptyBitmap } from "@/lib/availability";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOTS_PER_DAY = 48;
// Display window: 6am (slot 12) → 11pm (slot 46) inclusive
const DISPLAY_START = 12;
const DISPLAY_END = 46;

function formatHour(slot: number): string {
  const hour = Math.floor(slot / 2);
  const ampm = hour < 12 ? "am" : "pm";
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h}${ampm}`;
}

interface GridPickerProps {
  value: Uint8Array;
  onChange: (bitmap: Uint8Array) => void;
  timezone: string;
  readonly?: boolean;
  showFooter?: boolean;
  className?: string;
}

export function GridPicker({
  value,
  onChange,
  timezone,
  readonly = false,
  showFooter = true,
  className,
}: GridPickerProps) {
  const [activeDay, setActiveDay] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragModeRef = useRef<boolean>(true); // true = painting ON, false = painting OFF

  const handlePointerDown = useCallback(
    (bitIndex: number) => {
      if (readonly) return;
      setIsDragging(true);
      const isCurrentlySet = getBit(value, bitIndex);
      dragModeRef.current = !isCurrentlySet;

      const newBitmap = new Uint8Array(value);
      if (dragModeRef.current) {
        setBit(newBitmap, bitIndex);
      } else {
        clearBit(newBitmap, bitIndex);
      }
      onChange(newBitmap);
    },
    [value, onChange, readonly],
  );

  const handlePointerEnter = useCallback(
    (bitIndex: number) => {
      if (!isDragging || readonly) return;
      const newBitmap = new Uint8Array(value);
      if (dragModeRef.current) {
        setBit(newBitmap, bitIndex);
      } else {
        clearBit(newBitmap, bitIndex);
      }
      onChange(newBitmap);
    },
    [isDragging, value, onChange, readonly],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const applyPreset = useCallback(
    (preset: "weekday-evenings" | "weekday-mornings" | "late-night" | "clear") => {
      const bitmap = createEmptyBitmap();
      if (preset === "clear") {
        onChange(bitmap);
        return;
      }
      if (preset === "weekday-evenings") {
        // Mon-Fri (days 1-5), 7pm-10pm (slots 38-43)
        for (let day = 1; day <= 5; day++) {
          for (let slot = 38; slot <= 43; slot++) {
            setBit(bitmap, day * SLOTS_PER_DAY + slot);
          }
        }
      } else if (preset === "weekday-mornings") {
        // Mon-Fri (days 1-5), 6am-9am (slots 12-17)
        for (let day = 1; day <= 5; day++) {
          for (let slot = 12; slot <= 17; slot++) {
            setBit(bitmap, day * SLOTS_PER_DAY + slot);
          }
        }
      } else if (preset === "late-night") {
        // Every day, 10pm-11pm (slots 44-46, within display window)
        for (let day = 0; day < 7; day++) {
          for (let slot = 44; slot <= DISPLAY_END; slot++) {
            setBit(bitmap, day * SLOTS_PER_DAY + slot);
          }
        }
      }
      onChange(bitmap);
    },
    [onChange],
  );

  const renderDayColumn = (dayIndex: number, isMobile: boolean) => (
    <div key={dayIndex} className={cn("flex flex-col", isMobile ? "min-w-full snap-center" : "flex-1 min-w-0")}>
      {!isMobile && (
        <div className="text-center text-xs font-medium text-muted-foreground pb-1">
          {DAYS[dayIndex]}
        </div>
      )}
      <div className="flex flex-col gap-px">
        {Array.from({ length: DISPLAY_END - DISPLAY_START + 1 }, (_, i) => {
          const slotIndex = DISPLAY_START + i;
          const bitIndex = dayIndex * SLOTS_PER_DAY + slotIndex;
          const isSet = getBit(value, bitIndex);
          const isHour = slotIndex % 2 === 0;

          return (
            <div key={slotIndex} className="flex items-center">
              {isMobile && isHour && (
                <span className="w-10 text-[10px] text-muted-foreground text-right pr-1.5 shrink-0">
                  {formatHour(slotIndex)}
                </span>
              )}
              <div
                className={cn(
                  "h-[14px] flex-1 border border-border/30 transition-colors cursor-pointer select-none",
                  isSet ? "bg-accent/80" : "bg-transparent hover:bg-accent/20",
                  readonly && "cursor-default hover:bg-transparent",
                  isHour && "border-t-border/60",
                )}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handlePointerDown(bitIndex);
                }}
                onPointerEnter={() => handlePointerEnter(bitIndex)}
                onPointerUp={handlePointerUp}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className={cn("flex flex-col gap-3", className)}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Timezone banner */}
      <div className="text-xs text-muted-foreground text-center">
        Your timezone is <span className="font-medium text-foreground">{timezone}</span>{" "}
        <a href="/onboarding?step=4" className="text-accent hover:underline">
          (change)
        </a>
      </div>

      {/* Mobile: Day tabs + scroll-snap column */}
      <div className="md:hidden">
        <div className="flex gap-1 justify-center mb-2">
          {DAYS.map((day, i) => (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(i)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-full transition-colors",
                i === activeDay
                  ? "bg-accent text-white"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {day}
            </button>
          ))}
        </div>
        <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border">
          {renderDayColumn(activeDay, true)}
        </div>
      </div>

      {/* Desktop: All 7 columns */}
      <div className="hidden md:block">
        <div className="flex gap-px rounded-lg border border-border overflow-hidden max-h-[500px] overflow-y-auto">
          {/* Hour labels — same structure as day columns so rows stay in sync */}
          <div className="flex flex-col shrink-0">
            {/* Invisible spacer matching the day-name header height */}
            <div className="text-center text-xs font-medium pb-1 invisible select-none" aria-hidden>
              X
            </div>
            <div className="flex flex-col gap-px">
              {Array.from({ length: DISPLAY_END - DISPLAY_START + 1 }, (_, i) => {
                const slotIndex = DISPLAY_START + i;
                return (
                  <div key={slotIndex} className="h-[14px] flex items-center">
                    {slotIndex % 2 === 0 && (
                      <span className="text-[9px] text-muted-foreground w-8 text-right pr-1">
                        {formatHour(slotIndex)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Day columns */}
          {Array.from({ length: 7 }, (_, dayIndex) => renderDayColumn(dayIndex, false))}
        </div>
      </div>

      {/* Presets */}
      {!readonly && showFooter && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => applyPreset("weekday-evenings")}>
            Weekday evenings (7–10pm)
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => applyPreset("weekday-mornings")}>
            Weekday mornings (6–9am)
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => applyPreset("late-night")}>
            Late-night (10pm–11pm)
          </Button>
          <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => applyPreset("clear")}>
            Clear all
          </Button>
        </div>
      )}

      {/* Microcopy */}
      {!readonly && showFooter && (
        <p className="text-xs text-muted-foreground text-center">
          Don&apos;t worry about being exact — we&apos;ll match you with people whose times are
          close to yours, even if they&apos;re 30 minutes off.
        </p>
      )}
    </div>
  );
}
