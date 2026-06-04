"use client";

import { useState, useMemo, useCallback } from "react";
import { RRule, Weekday } from "rrule";
import { DateTime } from "luxon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface RRuleBuilderProps {
  value: { rrule: string; dtstart: string; timezone: string } | null;
  onChange: (value: { rrule: string; dtstart: string; timezone: string }) => void;
  timezone: string;
}

const DAYS = [
  { label: "Su", value: RRule.SU },
  { label: "Mo", value: RRule.MO },
  { label: "Tu", value: RRule.TU },
  { label: "We", value: RRule.WE },
  { label: "Th", value: RRule.TH },
  { label: "Fr", value: RRule.FR },
  { label: "Sa", value: RRule.SA },
] as const;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 15, 30, 45];

export function RRuleBuilder({ value, onChange, timezone }: RRuleBuilderProps) {
  const [selectedDays, setSelectedDays] = useState<Weekday[]>([RRule.MO]);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<"AM" | "PM">("PM");
  const [startDate, setStartDate] = useState(
    DateTime.now().setZone(timezone).toFormat("yyyy-MM-dd")
  );
  const hour24 = useMemo(() => {
    if (ampm === "AM") return hour === 12 ? 0 : hour;
    return hour === 12 ? 12 : hour + 12;
  }, [hour, ampm]);

  const rule = useMemo(() => {
    const dtstart = DateTime.fromISO(
      `${startDate}T${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
      { zone: timezone }
    ).toUTC().toJSDate();

    return new RRule({
      dtstart,
      freq: RRule.WEEKLY,
      interval: 1,
      byweekday: selectedDays,
    });
  }, [selectedDays, hour24, minute, startDate, timezone]);

  const nextDates = useMemo(() => {
    try {
      return rule.all((_, i) => i < 5).map((d) =>
        DateTime.fromJSDate(d).setZone(timezone).toFormat("EEE, MMM d 'at' h:mm a")
      );
    } catch {
      return [];
    }
  }, [rule, timezone]);

  const emitChange = useCallback(() => {
    const dtstart = DateTime.fromISO(
      `${startDate}T${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
      { zone: timezone }
    ).toISO()!;

    onChange({ rrule: rule.toString(), dtstart, timezone });
  }, [rule, startDate, hour24, minute, timezone, onChange]);

  // Auto-emit whenever the schedule changes
  useMemo(() => {
    const dtstart = DateTime.fromISO(
      `${startDate}T${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
      { zone: timezone }
    ).toISO();
    if (!dtstart) return;
    onChange({ rrule: rule.toString(), dtstart, timezone });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rule]);

  const toggleDay = (day: Weekday) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="space-y-6">

      {/* Day picker */}
      <div className="space-y-2">
        <Label>Day</Label>
        <div className="flex gap-2">
          {DAYS.map(({ label, value: day }) => (
            <button
              key={label}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                "w-10 h-10 rounded-full text-sm font-medium border transition-colors",
                selectedDays.includes(day)
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Time */}
      <div className="space-y-2">
        <Label>Time</Label>
        <div className="flex gap-2 items-center">
          <Select value={String(hour)} onValueChange={(v) => setHour(Number(v))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOURS.map((h) => (
                <SelectItem key={h} value={String(h)}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">:</span>
          <Select value={String(minute)} onValueChange={(v) => setMinute(Number(v))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MINUTES.map((m) => (
                <SelectItem key={m} value={String(m)}>{String(m).padStart(2, "0")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ampm} onValueChange={(v) => setAmpm(v as "AM" | "PM")}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Start date */}
      <div className="space-y-2">
        <Label>Starting</Label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      {/* Upcoming dates preview */}
      {nextDates.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Upcoming</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            {nextDates.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
