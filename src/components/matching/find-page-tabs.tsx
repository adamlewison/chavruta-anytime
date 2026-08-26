"use client";

import { useRef, useState } from "react";
import { Users2, Users, Search, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/brand/empty-state";
import { StudyMatchCard } from "@/components/matching/study-match-card";
import { ChaburaCard } from "@/components/matching/chabura-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { FullStudyMatchResult } from "@/server/queries/matches";
import type { listDiscoverChaburas } from "@/server/queries/chaburas";
import type { StudyProfileRow } from "@/server/actions/study-profiles";

type PublicChaburaResult = Awaited<ReturnType<typeof listDiscoverChaburas>>[number];

interface FindPageTabsProps {
  chavrutaMatches: FullStudyMatchResult[];
  chaburas: PublicChaburaResult[];
  profiles: StudyProfileRow[];
}

function ChaburaSkeletons() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border/60 p-5 flex gap-4 items-start"
        >
          <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/5" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FindPageTabs({
  chavrutaMatches,
  chaburas,
  profiles,
}: FindPageTabsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [chaburaLoading, setChaburaLoading] = useState(false);
  const chaburaActivatedRef = useRef(false);

  function handleTabChange(value: string) {
    if (value === "chabura" && !chaburaActivatedRef.current) {
      chaburaActivatedRef.current = true;
      setChaburaLoading(true);
      setTimeout(() => setChaburaLoading(false), 900);
    }
  }

  const query = searchQuery.trim().toLowerCase();

  const suggested = [...chaburas]
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 4);

  const filtered = query
    ? chaburas.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query),
      )
    : null;

  return (
    <>
      <Tabs
        defaultValue="chavruta"
        className="w-full"
        onValueChange={handleTabChange}
      >
        <TabsList className="!w-full !h-auto !p-1.5 gap-1.5 my-4 items-stretch">
          <TabsTrigger
            value="chavruta"
            className="flex-col gap-1.5 !h-auto !min-h-[7rem] !whitespace-normal !py-4 !px-3"
          >
            <Users2 className="!size-6 shrink-0" />
            <span className="font-semibold text-sm">Chavruta</span>
            <span className="text-[11px] font-normal leading-snug opacity-70 hidden sm:block">
              Find a 1-on-1 study partner
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="chabura"
            className="flex-col gap-1.5 !h-auto !min-h-[7rem] !whitespace-normal !py-4 !px-3"
          >
            <Users className="!size-6 shrink-0" />
            <span className="font-semibold text-sm">Chabura</span>
            <span className="text-[11px] font-normal leading-snug opacity-70 hidden sm:block">
              Join a group learning circle
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chavruta" className="mt-4">
          {profiles.length === 0 ? (
            <EmptyState
              heading="Create a study profile to get matched"
              description="A study profile tells us what you want to learn and when you're available, so we can find you the right chavruta."
              action={{
                label: "Create Study Profile",
                href: "/settings/learning-profiles",
              }}
              letter="ל"
            />
          ) : chavrutaMatches.length > 0 ? (
            <div className="space-y-4">
              {chavrutaMatches.map((match) => (
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
        </TabsContent>

        <TabsContent value="chabura" className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name or topic…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {chaburaLoading ? (
            <ChaburaSkeletons />
          ) : filtered !== null ? (
            filtered.length > 0 ? (
              <div className="space-y-4">
                {filtered.map((chabura) => (
                  <ChaburaCard key={chabura.id} chabura={chabura} />
                ))}
              </div>
            ) : (
              <EmptyState
                heading="No chaburas found"
                description="Try a different name or topic."
                letter="ח"
              />
            )
          ) : chaburas.length > 0 ? (
            <div className="space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Suggested
              </p>
              {suggested.map((chabura) => (
                <ChaburaCard key={chabura.id} chabura={chabura} />
              ))}
            </div>
          ) : (
            <EmptyState
              heading="No chaburas yet"
              description="Be the first to start a chabura and learn together with a group."
              action={{ label: "Start a Chabura", href: "/chaburas/new" }}
              letter="ח"
            />
          )}
        </TabsContent>
      </Tabs>

    </>
  );
}
