import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-8">
      {/* Greeting — name is fetched */}
      <Skeleton className="h-8 w-52" />

      {/* Next session card */}
      <Card className="border-accent/30">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-5 w-5 rounded shrink-0" />
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Upcoming This Week */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Upcoming This Week</h2>
        <div className="flex gap-3 overflow-hidden -mx-4 px-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="min-w-[200px] shrink-0">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* My Chavrutas */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">My Chavrutas</h2>
        <div className="flex gap-4 -mx-4 px-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </section>

      {/* Suggested Chavrutas */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Suggested Chavrutas</h2>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-44" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
