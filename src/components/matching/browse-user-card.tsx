import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, BookOpen } from "lucide-react";
import { languageName } from "@/lib/languages";

interface BrowseUserCardProps {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    country: string | null;
    languages: string[];
    subjects: Array<{ id: string; name: string }>;
  };
}

function initialsOf(name: string | null): string {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

export function BrowseUserCard({ user }: BrowseUserCardProps) {
  return (
    <Link href={`/find/${user.id}`} className="block">
      <Card className="hover:border-accent/50 transition-colors">
        <CardContent className="flex items-start gap-3 p-4">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
            <AvatarFallback className="text-sm">
              {initialsOf(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="font-medium text-sm truncate">
              {user.name || "Anonymous"}
            </p>
            {user.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {user.bio}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {user.country && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {user.country}
                </span>
              )}
              {user.languages.length > 0 && (
                <span>🗣️ {user.languages.map(languageName).join(", ")}</span>
              )}
            </div>
            {user.subjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {user.subjects.slice(0, 4).map((s) => (
                  <Badge key={s.id} variant="secondary" className="gap-1 text-[10px]">
                    <BookOpen className="h-2.5 w-2.5" />
                    {s.name}
                  </Badge>
                ))}
                {user.subjects.length > 4 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{user.subjects.length - 4}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
