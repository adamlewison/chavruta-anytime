import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const session = await auth();

  if (session?.user?.onboardedAt) {
    //redirect("/dashboard");
  }

  const { step } = await searchParams;
  const currentStep = Math.min(6, Math.max(1, Number(step) || 1));

  return (
    <OnboardingWizard
      initialStep={currentStep}
      prefill={{
        name: session?.user?.name ?? "",
        image: session?.user?.image ?? null,
      }}
    />
  );
}
