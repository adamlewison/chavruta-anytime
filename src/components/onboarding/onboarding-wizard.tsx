"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { StepIdentity } from "./steps/step-identity";
import { StepBasics } from "./steps/step-basics";
import { StepLanguages } from "./steps/step-languages";
import { StepTimezone } from "./steps/step-timezone";
import { StepSubjects } from "./steps/step-subjects";
import { StepAvailability } from "./steps/step-availability";
import { completeOnboarding } from "@/server/actions/onboarding";

export interface OnboardingData {
  name: string;
  bio: string;
  image: string | null;
  gender: "male" | "female" | null;
  country: string;
  postCode: string;
  languages: string[];
  timezone: string;
  subjects: string[];
  availability: Uint8Array | null;
}

const STORAGE_KEY = "chavruta-onboarding-data";
const TOTAL_STEPS = 6;

const STEP_LABELS = [
  "Identity",
  "Basics",
  "Languages",
  "Timezone",
  "Subjects",
  "Availability",
];

interface Prefill {
  name: string;
  image: string | null;
}

function defaultData(prefill?: Prefill): OnboardingData {
  return {
    name: prefill?.name ?? "",
    bio: "",
    image: prefill?.image ?? null,
    gender: null,
    country: "",
    postCode: "",
    languages: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    subjects: [],
    availability: null,
  };
}

function getInitialData(prefill?: Prefill): OnboardingData {
  const base = defaultData(prefill);
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Apply stored values over base, but keep prefill for empty fields
        return {
          ...base,
          ...parsed,
          name: parsed.name?.trim() ? parsed.name : base.name,
          image: parsed.image ?? base.image,
          availability: null,
        };
      }
    } catch {
      // ignore parse errors
    }
  }
  return base;
}

function validateStep(step: number, data: OnboardingData): string | null {
  switch (step) {
    case 1:
      if (!data.name.trim()) return "Please enter your name";
      return null;
    case 2:
      if (!data.gender) return "Please select your gender";
      if (!data.country) return "Please select your country";
      return null;
    case 3:
      if (data.languages.length === 0)
        return "Please select at least one language";
      return null;
    case 4:
      if (!data.timezone) return "Please select a timezone";
      return null;
    case 5:
      if (data.subjects.length === 0)
        return "Please select at least one subject";
      return null;
    case 6:
      return null;
    default:
      return null;
  }
}

export function OnboardingWizard({
  initialStep,
  prefill,
}: {
  initialStep: number;
  prefill?: Prefill;
}) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [step, setStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);
  const [data, setData] = useState<OnboardingData>(() =>
    getInitialData(prefill),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Save to localStorage on data changes
  useEffect(() => {
    try {
      const toStore = { ...data, availability: null };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // ignore storage errors
    }
  }, [data]);

  const handleChange = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
    setError(null);
  }, []);

  const goToStep = useCallback(
    (newStep: number, dir: number) => {
      setDirection(dir);
      setStep(newStep);
      router.push(`/onboarding?step=${newStep}`, { scroll: false });
    },
    [router],
  );

  const handleNext = useCallback(() => {
    const validationError = validateStep(step, data);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    if (step < TOTAL_STEPS) {
      goToStep(step + 1, 1);
    }
  }, [step, data, goToStep]);

  const handleBack = useCallback(() => {
    setError(null);
    if (step > 1) {
      goToStep(step - 1, -1);
    }
  }, [step, goToStep]);

  const handleComplete = useCallback(async () => {
    const validationError = validateStep(step, data);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const result = await completeOnboarding({
        name: data.name,
        bio: data.bio,
        image: data.image,
        gender: data.gender as "male" | "female",
        country: data.country,
        postCode: data.postCode,
        languages: data.languages,
        timezone: data.timezone,
        subjects: data.subjects,
        availability: data.availability ? Array.from(data.availability) : [],
      });
      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        setSubmitting(false);
        return;
      }
      localStorage.removeItem(STORAGE_KEY);
      await updateSession();
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }, [step, data, router, updateSession]);

  const variants = {
    enter: (dir: number) => ({
      x: dir >= 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir >= 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Logo */}
      <div className="text-center">
        <Logo size="md" />
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < step;
          const isCurrent = stepNum === step;
          return (
            <div key={stepNum} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "size-2.5 rounded-full transition-all duration-300",
                  isCompleted && "bg-accent",
                  isCurrent && "bg-accent scale-125 ring-2 ring-accent/30",
                  !isCompleted && !isCurrent && "bg-border",
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Step label */}
      <p className="text-center text-sm text-muted-foreground">
        Step {step} of {TOTAL_STEPS}: {STEP_LABELS[step - 1]}
      </p>

      {/* Step content */}
      <Card className="rounded-2xl shadow-sm bg-card overflow-hidden">
        <CardContent className="pt-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {step === 1 && (
                <StepIdentity data={data} onChange={handleChange} />
              )}
              {step === 2 && <StepBasics data={data} onChange={handleChange} />}
              {step === 3 && (
                <StepLanguages data={data} onChange={handleChange} />
              )}
              {step === 4 && (
                <StepTimezone data={data} onChange={handleChange} />
              )}
              {step === 5 && (
                <StepSubjects data={data} onChange={handleChange} />
              )}
              {step === 6 && (
                <StepAvailability data={data} onChange={handleChange} />
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-destructive font-medium"
        >
          {error}
        </motion.p>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3">
        {step > 1 && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1"
            size="lg"
          >
            Back
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button
            onClick={handleNext}
            className="flex-1 bg-accent text-white hover:bg-accent/90"
            size="lg"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={submitting}
            className="flex-1 bg-accent text-white hover:bg-accent/90"
            size="lg"
          >
            {submitting ? "Saving…" : "Complete"}
          </Button>
        )}
      </div>
    </div>
  );
}
