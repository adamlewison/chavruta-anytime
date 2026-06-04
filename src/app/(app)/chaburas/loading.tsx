import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";

export default function ChaburaLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Chaburas</h1>
        <Button asChild className="gap-2 bg-accent text-white hover:bg-accent/90">
          <Link href="/chaburas/new">
            <Plus className="h-4 w-4" />
            Create
          </Link>
        </Button>
      </div>

      {/* Search bar placeholder */}
      <Skeleton className="h-10 w-full rounded-lg" />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">My Chaburas</h2>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-full max-w-xs" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Discover</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-full max-w-sm" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
