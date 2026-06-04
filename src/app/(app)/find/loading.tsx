import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

export default function FindLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Find a Chavruta</h1>
        <Button variant="outline" size="sm" className="gap-2" disabled>
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 border rounded-xl bg-card">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
