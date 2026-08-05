import Link from "next/link";
import { Plus, BookOpen, Users, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/brand/empty-state";
import { ChaburaSearch } from "@/components/chaburas/chabura-search";
import { ChaburasTable } from "@/components/chaburas/chaburas-table";

export interface ChaburaRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  isPublic: boolean | null;
  memberCount: number;
}

function ChaburaCard({ c }: { c: ChaburaRow }) {
  return (
    <Link href={`/chaburas/${c.slug}`} className="block">
      <Card className="hover:border-accent/50 transition-colors">
        <CardContent className="flex items-start gap-3 p-4">
          {c.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.image}
              alt={c.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
              <BookOpen className="h-5 w-5 text-accent" />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{c.name}</p>
              <Badge variant="outline" className="shrink-0 gap-1 text-[10px]">
                {c.isPublic ? (
                  <>
                    <Globe className="h-3 w-3" /> Public
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" /> Private
                  </>
                )}
              </Badge>
            </div>
            {c.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {c.description}
              </p>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {c.memberCount} member{c.memberCount !== 1 ? "s" : ""}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ChaburasList({
  query,
  myChaburas,
  discover,
}: {
  query: string;
  myChaburas: ChaburaRow[];
  discover: ChaburaRow[];
}) {
  const nothingToShow = myChaburas.length === 0 && discover.length === 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Chaburas
        </h1>
        <Button asChild className="gap-2 bg-accent text-white hover:bg-accent/90">
          <Link href="/chaburas/new">
            <Plus className="h-4 w-4" />
            Create
          </Link>
        </Button>
      </div>

      <ChaburaSearch initialQuery={query} />

      {nothingToShow ? (
        query ? (
          <EmptyState
            heading="No chaburas match your search"
            description={`Nothing found for "${query}". Try a different keyword, or start your own.`}
            action={{ label: "Start a Chabura", href: "/chaburas/new" }}
            letter="כ"
          />
        ) : (
          <EmptyState
            heading="No chaburas yet"
            description="Be the first to start one. Gather learners around a shared topic."
            action={{ label: "Start a Chabura", href: "/chaburas/new" }}
            letter="כ"
          />
        )
      ) : (
        <>
          {myChaburas.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">
                My Chaburas
              </h2>
              <ChaburasTable chaburas={myChaburas} />
            </section>
          )}

          {discover.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">
                Discover
              </h2>
              <div className="space-y-3">
                {discover.map((c) => (
                  <ChaburaCard key={c.id} c={c} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
