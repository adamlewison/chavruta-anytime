"use client";

import { Suspense } from "react";
import { VerifyForm } from "@/components/auth/verify-form";
import { Logo } from "@/components/brand/logo";

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-8">
          <Logo size="lg" />
          <div className="w-full rounded-xl border border-border bg-card p-8 shadow-sm">
            <p className="text-center text-sm text-muted-foreground">
              Loading…
            </p>
          </div>
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
