"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepWelcomeProps {
  onNext: () => void;
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="rounded-full bg-accent/10 p-4">
        <Sparkles className="size-10 text-accent" />
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold text-foreground">
          Welcome to ChavrutaAnytime
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          We are so excited that you have decided to jump onboard!
        </p>
        <p className="text-base text-muted-foreground">
          It only takes one minute to set up your profile!
        </p>
      </div>
      <Button
        onClick={onNext}
        size="lg"
        className="w-full bg-accent text-white hover:bg-accent/90 animate-glow-pulse"
      >
        Get Started
      </Button>
    </div>
  );
}
