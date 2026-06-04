import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function UserProfileLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      {/* ProfileHeader */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-[150px] w-[150px] rounded-full shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* ConnectButton area */}
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Sessions Together table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
        <div className="rounded-lg border overflow-hidden">
          {/* Table header */}
          <div className="bg-muted/40 border-b px-4 py-2.5 flex gap-8">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-14" />
          </div>
          {/* Table rows */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`px-4 py-3 flex items-center gap-8 ${i < 2 ? "border-b" : ""}`}
            >
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <div className="ml-auto flex gap-1">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Interests card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-5 w-36" />
          <div className="flex flex-wrap gap-2">
            {[80, 96, 72, 88].map((w) => (
              <Skeleton key={w} className="h-6 rounded-full" style={{ width: w }} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Availability Overlap card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-5 w-44" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Separator />
          {/* Heatmap placeholder */}
          <Skeleton className="h-24 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}
