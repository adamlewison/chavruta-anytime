import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ProfileLoading() {
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

      {/* Edit Profile button */}
      <Skeleton className="h-9 w-full rounded-md" />

      {/* Subjects card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-5 w-20" />
          <div className="flex flex-wrap gap-2">
            {[80, 96, 72].map((w) => (
              <Skeleton key={w} className="h-6 rounded-full" style={{ width: w }} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
