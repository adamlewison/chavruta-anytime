import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getStudyMatchesForCurrentUser } from "@/server/actions/matches";
import { EmptyState } from "@/components/brand/empty-state";
import { StudyMatchCard } from "@/components/matching/study-match-card";

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

  const matches = await getStudyMatchesForCurrentUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Find a Chavruta</h1>
          {matches.length > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {matches.length} compatible learner{matches.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>
      </div>

      {matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((match) => (
            <StudyMatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <EmptyState
          heading="We need more learners like you"
          description="No matches found yet. Invite a friend so we can grow the beis medrash."
          action={{ label: "Invite a Friend", href: "/settings" }}
          letter="ל"
        />
      )}
    </div>
  );
}
