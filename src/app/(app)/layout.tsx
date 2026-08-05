import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { AppShell } from "@/components/layout/app-shell";
import { OnboardingRedirect } from "@/components/onboarding/onboarding-redirect";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (!session.user.onboardedAt) {
    // Render without AppShell; client component handles redirect to /onboarding
    return <OnboardingRedirect>{children}</OnboardingRedirect>;
  }

  return <AppShell>{children}</AppShell>;
}
