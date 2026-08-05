import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listSubjectOptions } from "@/server/queries/subjects";
import { NewChaburaForm } from "@/components/chaburas/new-chabura-form";

export const metadata: Metadata = {
  title: "Start a Chabura — ChavrutaAnytime",
};

export default async function NewChaburaPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  if (!session.user.onboardedAt) {
    redirect("/onboarding");
  }

  let subjectOptions: Array<{ id: string; name: string }> = [];
  try {
    subjectOptions = await listSubjectOptions();
  } catch (error) {
    console.error("Load subjects error:", error);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        Start a Chabura
      </h1>
      <NewChaburaForm subjects={subjectOptions} />
    </div>
  );
}
