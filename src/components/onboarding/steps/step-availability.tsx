"use client";

import { GridPicker } from "@/components/availability/grid-picker";
import { createEmptyBitmap } from "@/lib/availability";
import type { OnboardingData } from "../onboarding-wizard";

interface StepAvailabilityProps {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

export function StepAvailability({ data, onChange }: StepAvailabilityProps) {
  const bitmap = data.availability ?? createEmptyBitmap();

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">
          When are you available?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the times you can learn each week
        </p>
      </div>
      <GridPicker
        value={bitmap}
        onChange={(newBitmap) => onChange({ availability: newBitmap })}
        timezone={data.timezone}
      />
    </div>
  );
}
