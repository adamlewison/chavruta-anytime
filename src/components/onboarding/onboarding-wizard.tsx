"use client";

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
import { useOnboardingWizard, TOTAL_STEPS } from "@/hooks/use-onboarding-wizard";
import type { Prefill } from "./types";

const STEP_LABELS = [
  "Identity",
  "Basics",
  "Languages",
  "Timezone",
  "Subjects",
  "Availability",
];

export function OnboardingWizard({
  initialStep,
  prefill,
}: {
  initialStep: number;
  prefill?: Prefill;
}) {
  const {
    step,
    direction,
    data,
    error,
    submitting,
    handleChange,
    handleNext,
    handleBack,
    handleComplete,
  } = useOnboardingWizard(initialStep, prefill);

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
