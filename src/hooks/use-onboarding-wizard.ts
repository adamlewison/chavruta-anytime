"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { completeOnboarding } from "@/server/actions/onboarding";
import type { OnboardingData, Prefill } from "@/components/onboarding/types";

const STORAGE_KEY = "chavruta-onboarding-data";
export const TOTAL_STEPS = 6;

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

/**
 * Owns all step/data/error/submitting state for the onboarding wizard,
 * including localStorage persistence and the completeOnboarding submit.
 * The component only renders based on what this hook returns.
 */
export function useOnboardingWizard(initialStep: number, prefill?: Prefill) {
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

  return {
    step,
    direction,
    data,
    error,
    submitting,
    handleChange,
    handleNext,
    handleBack,
    handleComplete,
  };
}
