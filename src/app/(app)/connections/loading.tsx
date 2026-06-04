import { Skeleton } from "@/components/ui/skeleton";

export default function ConnectionsLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      {/* Search bar */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Table rows */}
      <div className="rounded-lg border overflow-hidden divide-y divide-border">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}
