"use client";

import { getBit } from "@/domain/availability";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOTS_PER_DAY = 48;

function formatHour(slot: number): string {
  const hour = Math.floor(slot / 2);
  const ampm = hour < 12 ? "am" : "pm";
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h}${ampm}`;
}

interface HeatmapProps {
  strictMask: Uint8Array;
  nearMask: Uint8Array;
  userMask?: Uint8Array;
  otherMask?: Uint8Array;
  className?: string;
}

export function Heatmap({
  strictMask,
  nearMask,
  userMask,
  otherMask,
  className,
}: HeatmapProps) {
  const getCellColor = (bitIndex: number): string => {
    if (getBit(strictMask, bitIndex)) return "bg-accent";
    if (getBit(nearMask, bitIndex)) return "bg-accent/50";
    if (userMask && getBit(userMask, bitIndex)) return "bg-muted-foreground/20";
    if (otherMask && getBit(otherMask, bitIndex)) return "bg-muted-foreground/10";
    return "bg-transparent";
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Legend */}
      <div className="flex gap-3 justify-center text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <div className="size-2.5 rounded-sm bg-accent" /> Exact overlap
        </span>
        <span className="flex items-center gap-1">
          <div className="size-2.5 rounded-sm bg-accent/50" /> Close match
        </span>
      </div>

      {/* Grid */}
      <div className="flex gap-px rounded-lg border border-border overflow-hidden max-h-[300px] overflow-y-auto">
        {/* Hour labels */}
        <div className="flex flex-col pt-5 shrink-0">
          {Array.from({ length: SLOTS_PER_DAY }, (_, i) => (
            <div key={i} className="h-[10px] flex items-center">
              {i % 4 === 0 && (
                <span className="text-[8px] text-muted-foreground w-7 text-right pr-1">
                  {formatHour(i)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {Array.from({ length: 7 }, (_, dayIndex) => (
          <div key={dayIndex} className="flex flex-col flex-1">
            <div className="text-center text-[9px] font-medium text-muted-foreground pb-0.5">
              {DAYS[dayIndex]}
            </div>
            <div className="flex flex-col gap-px">
              {Array.from({ length: SLOTS_PER_DAY }, (_, slotIndex) => {
                const bitIndex = dayIndex * SLOTS_PER_DAY + slotIndex;
                return (
                  <div
                    key={slotIndex}
                    className={cn("h-[10px] border border-border/20", getCellColor(bitIndex))}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
