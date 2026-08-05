import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStudyProfiles } from "@/server/actions/study-profiles";
import { LearningProfiles } from "@/components/settings/learning-profiles";

export const metadata: Metadata = {
  title: "Learning Profiles — Settings — ChavrutaAnytime",
};

export default async function LearningProfilesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [[userRow], { profiles, subjects }] = await Promise.all([
    db()
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, session.user.id)),
    getStudyProfiles(),
  ]);

  const timezone = userRow?.timezone ?? "UTC";

  return <LearningProfiles profiles={profiles} subjects={subjects} timezone={timezone} />;
}
