"use client";

import { useState, useEffect } from "react";
import { Clock, Globe } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OnboardingData } from "../onboarding-wizard";

interface StepTimezoneProps {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const TIMEZONES = [
  {
    region: "Americas",
    zones: [
      { value: "America/New_York", label: "Eastern Time (New York)" },
      { value: "America/Chicago", label: "Central Time (Chicago)" },
      { value: "America/Denver", label: "Mountain Time (Denver)" },
      { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
      { value: "America/Toronto", label: "Toronto" },
      { value: "America/Anchorage", label: "Alaska" },
      { value: "America/Sao_Paulo", label: "Sao Paulo" },
      { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires" },
      { value: "America/Mexico_City", label: "Mexico City" },
    ],
  },
  {
    region: "Europe",
    zones: [
      { value: "Europe/London", label: "London (GMT/BST)" },
      { value: "Europe/Paris", label: "Paris (CET)" },
      { value: "Europe/Berlin", label: "Berlin (CET)" },
      { value: "Europe/Amsterdam", label: "Amsterdam (CET)" },
      { value: "Europe/Moscow", label: "Moscow" },
      { value: "Europe/Kiev", label: "Kyiv" },
    ],
  },
  {
    region: "Middle East",
    zones: [
      { value: "Asia/Jerusalem", label: "Jerusalem (IST)" },
    ],
  },
  {
    region: "Asia & Pacific",
    zones: [
      { value: "Australia/Sydney", label: "Sydney (AEST)" },
      { value: "Australia/Melbourne", label: "Melbourne (AEST)" },
      { value: "Pacific/Auckland", label: "Auckland (NZST)" },
      { value: "Asia/Tokyo", label: "Tokyo (JST)" },
      { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
    ],
  },
  {
    region: "Africa",
    zones: [
      { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
    ],
  },
];

function formatTimeInZone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      weekday: "short",
    }).format(new Date());
  } catch {
    return "";
  }
}

export function StepTimezone({ data, onChange }: StepTimezoneProps) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setCurrentTime(formatTimeInZone(data.timezone));
    const interval = setInterval(() => {
      setCurrentTime(formatTimeInZone(data.timezone));
    }, 1000);
    return () => clearInterval(interval);
  }, [data.timezone]);

  const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isAutoDetected = data.timezone === detectedTz;

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">
          Your timezone
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          So we can match you with chavrutas in compatible timezones
        </p>
      </div>

      {/* Current time display */}
      <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-5 text-center">
        <div className="flex items-center justify-center gap-2 text-accent mb-2">
          <Clock className="size-5" />
          <span className="text-sm font-medium">
            {isAutoDetected ? "Auto-detected" : "Selected timezone"}
          </span>
        </div>
        <p className="text-2xl font-semibold text-foreground font-mono">
          {currentTime}
        </p>
        <p className="mt-1 text-sm text-muted-foreground flex items-center justify-center gap-1">
          <Globe className="size-3.5" />
          {data.timezone.replace(/_/g, " ")}
        </p>
      </div>

      {/* Timezone selector */}
      <div className="flex flex-col gap-2">
        <Label>Change timezone</Label>
        <Select
          value={data.timezone}
          onValueChange={(value) => onChange({ timezone: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((group) => (
              <SelectGroup key={group.region}>
                <SelectLabel>{group.region}</SelectLabel>
                {group.zones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
