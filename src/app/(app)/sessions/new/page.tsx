import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { subjects, users } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { NewSessionForm } from "./new-session-form";

export const metadata: Metadata = {
  title: "Create Session — ChavrutaAnytime",
};

export default async function NewSessionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!session.user.onboardedAt) redirect("/onboarding");

  // Load subjects and user timezone server-side
  const allSubjects = await db()
    .select({ slug: subjects.slug, name: subjects.name })
    .from(subjects)
    .orderBy(asc(subjects.sortOrder), asc(subjects.name));

  const [userRow] = await db()
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, session.user.id));

  const userTimezone = userRow?.timezone ?? "UTC";

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
      }
    >
      <NewSessionForm subjects={allSubjects} userTimezone={userTimezone} />
    </Suspense>
  );
}
