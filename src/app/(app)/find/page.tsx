import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getStudyMatchesForCurrentUser } from "@/server/queries/matches";
import { getUserChaburaMembershipIds, listDiscoverChaburas } from "@/server/queries/chaburas";
import { getStudyProfiles } from "@/server/actions/study-profiles";
import { FindPageTabs } from "@/components/matching/find-page-tabs";

export const metadata: Metadata = {
  title: "Find a Chavruta — ChavrutaAnytime",
};

export const dynamic = "force-dynamic";

export default async function FindPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (!session.user.onboardedAt) {
    redirect("/onboarding");
  }

  const [matches, myChaburaIds, { profiles }] = await Promise.all([
    getStudyMatchesForCurrentUser(),
    getUserChaburaMembershipIds(session.user.id),
    getStudyProfiles(),
  ]);

  const chaburas = await listDiscoverChaburas(myChaburaIds);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Find</h1>
      <FindPageTabs
        chavrutaMatches={matches}
        chaburas={chaburas}
        profiles={profiles}
      />
    </div>
  );
}
