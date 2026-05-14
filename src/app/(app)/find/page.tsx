import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getMatches } from "@/server/actions/match";
import { EmptyState } from "@/components/brand/empty-state";
import { MatchCard } from "@/components/matching/match-card";
import { FindFilterSheet } from "@/components/matching/find-filter-sheet";

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

  const matches = await getMatches(20);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Find a Chavruta
        </h1>
        <Suspense>
          <FindFilterSheet />
        </Suspense>
      </div>

      {matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard
              key={match.user.id}
              userId={match.user.id}
              name={match.user.name}
              image={match.user.image}
              score={match.score}
              sharedSubjects={match.highlights.sharedSubjects}
              sharedLanguages={match.highlights.sharedLanguages}
              exactHours={match.highlights.exactHoursPerWeek}
              nearHours={match.highlights.nearHoursPerWeek}
              teachingComplement={match.highlights.teachingComplement}
              bio={match.user.bio}
            />
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
