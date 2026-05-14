"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function OnboardingRedirect({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  useEffect(() => {
    if (!isOnboardingRoute) {
      router.replace("/onboarding");
    }
  }, [isOnboardingRoute, router]);

  if (!isOnboardingRoute) {
    return null;
  }

  return <>{children}</>;
}
