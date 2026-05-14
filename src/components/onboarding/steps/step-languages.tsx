"use client";

import { cn } from "@/lib/utils";
import type { OnboardingData } from "../onboarding-wizard";

interface StepLanguagesProps {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

const LANGUAGES = [
  { code: "en", name: "English", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "he", name: "Hebrew", flag: "\u{1F1EE}\u{1F1F1}" },
  { code: "yi", name: "Yiddish", flag: "" },
  { code: "fr", name: "French", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "es", name: "Spanish", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "ru", name: "Russian", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "ar", name: "Arabic", flag: "" },
  { code: "arc", name: "Aramaic", flag: "" },
  { code: "de", name: "German", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "pt", name: "Portuguese", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "it", name: "Italian", flag: "\u{1F1EE}\u{1F1F9}" },
];

export function StepLanguages({ data, onChange }: StepLanguagesProps) {
  const toggleLanguage = (code: string) => {
    const current = data.languages;
    if (current.includes(code)) {
      onChange({ languages: current.filter((l) => l !== code) });
    } else {
      onChange({ languages: [...current, code] });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">
          Languages you speak
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select all languages you can learn in
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {LANGUAGES.map((lang) => {
          const isSelected = data.languages.includes(lang.code);
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => toggleLanguage(lang.code)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
                "border-2",
                isSelected
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-background text-muted-foreground hover:border-accent/50"
              )}
            >
              {lang.flag && <span className="text-base">{lang.flag}</span>}
              {lang.name}
            </button>
          );
        })}
      </div>

      {data.languages.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {data.languages.length} language
          {data.languages.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
