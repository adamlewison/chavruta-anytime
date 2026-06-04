"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Clock, Globe } from "lucide-react";
import { updateProfile } from "@/server/actions/profile";
import { COUNTRIES, TIMEZONES } from "@/lib/location-data";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationSettingsProps {
  initialCountry: string;
  initialTimezone: string;
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

export function LocationSettings({
  initialCountry,
  initialTimezone,
}: LocationSettingsProps) {
  const [country, setCountry] = useState(initialCountry);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [currentTime, setCurrentTime] = useState("");
  const [isPending, startTransition] = useTransition();

  const isDirty = country !== initialCountry || timezone !== initialTimezone;

  useEffect(() => {
    if (!timezone) return;
    setCurrentTime(formatTimeInZone(timezone));
    const interval = setInterval(
      () => setCurrentTime(formatTimeInZone(timezone)),
      1000,
    );
    return () => clearInterval(interval);
  }, [timezone]);

  function handleSave() {
    startTransition(async () => {
      const result = await updateProfile({ country, timezone });
      if (result.success) {
        toast.success("Location updated");
      } else {
        toast.error(result.error ?? "Failed to update location");
      }
    });
  }

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">
          Location &amp; Timezone
        </h2>
        <p className="text-sm text-muted-foreground">
          Used for chavruta matching and scheduling in compatible timezones.
        </p>
      </div>

      <div className="space-y-5">
        {/* Country */}
        <div className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-center">
          <Label>Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((group) => (
                <SelectGroup key={group.region}>
                  <SelectLabel>{group.region}</SelectLabel>
                  {group.countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Timezone */}
        <div className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-start">
          <Label className="pt-2">Timezone</Label>
          <div className="space-y-3">
            {timezone && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold tabular-nums">
                    {currentTime}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    {timezone.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            )}
            <Select value={timezone} onValueChange={setTimezone}>
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

        <Separator />

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!isDirty || isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </section>
  );
}
