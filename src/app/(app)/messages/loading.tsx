import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function MessagesLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Messages</h1>

      <div className="divide-y border rounded-xl overflow-hidden bg-card">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarFallback className="bg-muted" />
            </Avatar>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-10 shrink-0" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
