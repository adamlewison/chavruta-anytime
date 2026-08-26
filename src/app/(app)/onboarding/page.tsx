import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getOwnProfile } from "@/server/queries/users";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const session = await auth();

  if (session?.user?.onboardedAt) {
    redirect("/dashboard");
  }

  const { step } = await searchParams;
  const currentStep = Math.min(7, Math.max(1, Number(step) || 1));

  const profile = session?.user?.id
    ? await getOwnProfile(session.user.id)
    : null;

  return (
    <OnboardingWizard
      initialStep={currentStep}
      prefill={{
        name: profile?.name ?? session?.user?.name ?? "",
        bio: profile?.bio ?? "",
        image: profile?.image ?? session?.user?.image ?? null,
      }}
    />
  );
}
