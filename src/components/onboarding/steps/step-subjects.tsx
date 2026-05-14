"use client";

import { cn } from "@/lib/utils";
import type { OnboardingData } from "../onboarding-wizard";

interface StepSubjectsProps {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const SUBJECTS = [
  { slug: "chumash", name: "Chumash", hebrew: "חומש" },
  { slug: "nach", name: "Nach", hebrew: 'נ"ך' },
  { slug: "mishna", name: "Mishna", hebrew: "משנה" },
  { slug: "gemara", name: "Gemara", hebrew: "גמרא" },
  { slug: "mussar", name: "Mussar", hebrew: "מוסר" },
  { slug: "chasidus", name: "Chasidus", hebrew: "חסידות" },
];

export function StepSubjects({ data, onChange }: StepSubjectsProps) {
  const selected = new Set(data.subjects);

  const toggle = (slug: string) => {
    const next = new Set(selected);
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }
    onChange({ subjects: Array.from(next) });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">
          What do you want to learn?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the subjects you&apos;re interested in
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SUBJECTS.map((subject) => {
          const isSelected = selected.has(subject.slug);
          return (
            <button
              key={subject.slug}
              type="button"
              onClick={() => toggle(subject.slug)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-4 text-center transition-all",
                isSelected
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-background text-muted-foreground hover:border-accent/50",
              )}
            >
              <span className="text-lg font-medium">{subject.name}</span>
              <span className="text-xs opacity-70">{subject.hebrew}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
