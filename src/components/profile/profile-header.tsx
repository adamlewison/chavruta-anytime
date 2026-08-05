import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { languageName } from "@/config/languages";

interface ProfileHeaderProps {
  name: string | null;
  image: string | null;
  bio: string | null;
  country: string | null;
  languages: string[] | null;
}

export function ProfileHeader({
  name,
  image,
  bio,
  country,
  languages,
}: ProfileHeaderProps) {
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-[150px] w-[150px] shrink-0 ring-[3px] ring-primary">
        <AvatarImage src={image || undefined} alt={name || "User"} />
        <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-1.5 pt-1">
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          {name || "Anonymous"}
        </h1>
        {(country || (languages && languages.length > 0)) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-muted-foreground">
            {country && (
              <span
                className={`fi fi-${country.toLowerCase()}`}
                style={{
                  width: "1.25rem",
                  height: "0.9rem",
                  display: "inline-block",
                  borderRadius: "0.5rem",
                }}
              />
            )}
          </div>
        )}
        {bio && <p className="text-sm text-muted-foreground">{bio}</p>}
      </div>
    </div>
  );
}
