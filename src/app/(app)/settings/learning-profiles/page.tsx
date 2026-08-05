import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getUserTimezone } from "@/server/queries/users";
import { getStudyProfiles } from "@/server/actions/study-profiles";
import { LearningProfiles } from "@/components/settings/learning-profiles";

export const metadata: Metadata = {
  title: "Learning Profiles — Settings — ChavrutaAnytime",
};

export default async function LearningProfilesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [userTimezone, { profiles, subjects }] = await Promise.all([
    getUserTimezone(session.user.id),
    getStudyProfiles(),
  ]);

  const timezone = userTimezone ?? "UTC";

  return <LearningProfiles profiles={profiles} subjects={subjects} timezone={timezone} />;
}
