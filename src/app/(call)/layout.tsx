import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function CallLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!session.user.onboardedAt) redirect("/onboarding");
  return <>{children}</>;
}
