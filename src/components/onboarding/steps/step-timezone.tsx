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
import { TIMEZONES } from "@/lib/location-data";
import type { OnboardingData } from "../onboarding-wizard";

interface StepTimezoneProps {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

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
