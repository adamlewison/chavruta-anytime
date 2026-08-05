"use client";

import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { COUNTRIES } from "@/config/location-data";
import type { OnboardingData } from "@/components/onboarding/types";

interface StepBasicsProps {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

export function StepBasics({ data, onChange }: StepBasicsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">
          Basic information
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Help us match you with the right chavrutas
        </p>
      </div>

      {/* Gender */}
      <div className="flex flex-col gap-2">
        <Label>
          Gender <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChange({ gender: "male" })}
            className={cn(
              "flex items-center justify-center rounded-xl border-2 px-4 py-4 text-sm font-medium transition-all",
              data.gender === "male"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-background text-muted-foreground hover:border-accent/50"
            )}
          >
            Male
          </button>
          <button
            type="button"
            onClick={() => onChange({ gender: "female" })}
            className={cn(
              "flex items-center justify-center rounded-xl border-2 px-4 py-4 text-sm font-medium transition-all",
              data.gender === "female"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-background text-muted-foreground hover:border-accent/50"
            )}
          >
            Female
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Used for chavruta matching only
        </p>
      </div>

      {/* Country */}
      <div className="flex flex-col gap-2">
        <Label>
          Country <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.country}
          onValueChange={(value) => onChange({ country: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((group) => (
              <SelectGroup key={group.region}>
                <SelectLabel>{group.region}</SelectLabel>
                {group.countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Post code */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="postCode">Post / Zip code (optional)</Label>
        <Input
          id="postCode"
          placeholder="e.g. 10001"
          value={data.postCode}
          onChange={(e) => onChange({ postCode: e.target.value })}
          maxLength={20}
          autoComplete="postal-code"
        />
      </div>
    </div>
  );
}
