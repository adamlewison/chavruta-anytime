"use client";

import { useState, useMemo, useCallback } from "react";
import { RRule, Weekday } from "rrule";
import { DateTime } from "luxon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RRuleBuilderProps {
  value: { rrule: string; dtstart: string; timezone: string } | null;
  onChange: (value: { rrule: string; dtstart: string; timezone: string }) => void;
  timezone: string;
}

type FrequencyOption = "once" | "weekly" | "biweekly" | "monthly";
type EndOption = "never" | "count" | "until";

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
  const [frequency, setFrequency] = useState<FrequencyOption>("weekly");
  const [selectedDays, setSelectedDays] = useState<Weekday[]>([RRule.MO]);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<"AM" | "PM">("PM");
  const [startDate, setStartDate] = useState(
    DateTime.now().setZone(timezone).toFormat("yyyy-MM-dd")
  );
  const [endOption, setEndOption] = useState<EndOption>("never");
  const [count, setCount] = useState(10);
  const [untilDate, setUntilDate] = useState(
    DateTime.now().setZone(timezone).plus({ months: 3 }).toFormat("yyyy-MM-dd")
  );

  const hour24 = useMemo(() => {
    if (ampm === "AM") return hour === 12 ? 0 : hour;
    return hour === 12 ? 12 : hour + 12;
  }, [hour, ampm]);

  const rule = useMemo(() => {
    const dtstart = DateTime.fromISO(`${startDate}T${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`, {
      zone: timezone,
    }).toUTC().toJSDate();

    if (frequency === "once") {
      return new RRule({
        freq: RRule.DAILY,
        count: 1,
        dtstart,
      });
    }

    const options: Partial<ConstructorParameters<typeof RRule>[0]> = {
      dtstart,
    };

    if (frequency === "weekly" || frequency === "biweekly") {
      options.freq = RRule.WEEKLY;
      options.interval = frequency === "biweekly" ? 2 : 1;
      options.byweekday = selectedDays;
    } else {
      options.freq = RRule.MONTHLY;
      options.interval = 1;
    }

    if (endOption === "count") {
      options.count = count;
    } else if (endOption === "until") {
      options.until = DateTime.fromISO(untilDate, { zone: timezone })
        .endOf("day")
        .toUTC()
        .toJSDate();
    }

    return new RRule(options as ConstructorParameters<typeof RRule>[0]);
  }, [frequency, selectedDays, hour24, minute, startDate, endOption, count, untilDate, timezone]);

  const nextDates = useMemo(() => {
    try {
      return rule.all((_, i) => i < 5).map((d) =>
        DateTime.fromJSDate(d).setZone(timezone).toFormat("EEE, MMM d, yyyy 'at' h:mm a")
      );
    } catch {
      return [];
    }
  }, [rule, timezone]);

  const plainEnglish = useMemo(() => {
    try {
      return rule.toText();
    } catch {
      return "";
    }
  }, [rule]);

  const emitChange = useCallback(() => {
    const dtstart = DateTime.fromISO(
      `${startDate}T${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
      { zone: timezone }
    ).toISO()!;

    onChange({
      rrule: rule.toString(),
      dtstart,
      timezone,
    });
  }, [rule, startDate, hour24, minute, timezone, onChange]);

  // Auto-emit whenever the schedule changes
  useMemo(() => {
    const dtstart = DateTime.fromISO(
      `${startDate}T${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
      { zone: timezone }
    ).toISO();
    if (!dtstart) return;
    onChange({
      rrule: rule.toString(),
      dtstart,
      timezone,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rule]);

  const toggleDay = (day: Weekday) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="space-y-6">
      {/* Frequency */}
      <div className="space-y-2">
        <Label>Frequency</Label>
        <div className="flex rounded-lg border p-1 gap-1">
          {(
            [
              ["once", "One-time"],
              ["weekly", "Weekly"],
              ["biweekly", "Bi-weekly"],
              ["monthly", "Monthly"],
            ] as const
          ).map(([val, label]) => (
            <Button
              key={val}
              type="button"
              variant={frequency === val ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setFrequency(val)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Days */}
      {(frequency === "weekly" || frequency === "biweekly") && (
        <div className="space-y-2">
          <Label>Days</Label>
          <div className="flex gap-2">
            {DAYS.map(({ label, value: day }) => (
              <Button
                key={label}
                type="button"
                variant={selectedDays.includes(day) ? "default" : "outline"}
                size="sm"
                className="w-10 h-10 rounded-full p-0"
                onClick={() => toggleDay(day)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}

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
                <SelectItem key={h} value={String(h)}>
                  {h}
                </SelectItem>
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
                <SelectItem key={m} value={String(m)}>
                  {String(m).padStart(2, "0")}
                </SelectItem>
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

      {/* Start Date */}
      <div className="space-y-2">
        <Label>Starts</Label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      {/* End */}
      {frequency !== "once" && (
        <div className="space-y-2">
          <Label>Ends</Label>
          <div className="flex gap-2 items-center">
            <Select value={endOption} onValueChange={(v) => setEndOption(v as EndOption)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="count">After N occurrences</SelectItem>
                <SelectItem value="until">On date</SelectItem>
              </SelectContent>
            </Select>
            {endOption === "count" && (
              <Input
                type="number"
                min={1}
                max={200}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-24"
              />
            )}
            {endOption === "until" && (
              <Input
                type="date"
                value={untilDate}
                onChange={(e) => setUntilDate(e.target.value)}
              />
            )}
          </div>
        </div>
      )}

      {/* Timezone */}
      <div className="space-y-2">
        <Label>Timezone</Label>
        <Badge variant="secondary">{timezone}</Badge>
      </div>

      {/* Preview */}
      <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
        <p className="text-sm font-medium">Preview</p>
        {plainEnglish && (
          <p className="text-sm text-muted-foreground capitalize">{plainEnglish}</p>
        )}
        {nextDates.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Next dates:</p>
            <ul className="text-sm space-y-0.5">
              {nextDates.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Confirm / re-apply (for explicit confirmation) */}
      <Button type="button" onClick={emitChange} variant="outline" size="sm" className="w-full">
        ✓ Confirm Schedule
      </Button>
    </div>
  );
}
