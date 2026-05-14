import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, userSubjects, subjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, MapPin, Globe, BookOpen } from "lucide-react";
import { languageName } from "@/lib/languages";

export const metadata: Metadata = {
  title: "My Profile — ChavrutaAnytime",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  if (!session.user.onboardedAt) {
    redirect("/onboarding");
  }

  let profile: {
    name: string | null;
    image: string | null;
    bio: string | null;
    country: string | null;
    timezone: string | null;
    languages: string[] | null;
    email: string | null;
  } = {
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    bio: null,
    country: null,
    timezone: null,
    languages: null,
    email: session.user.email ?? null,
  };

  let subjectsList: Array<{ name: string }> = [];

  try {
    const [row] = await db()
      .select({
        name: users.name,
        image: users.image,
        bio: users.bio,
        country: users.country,
        timezone: users.timezone,
        languages: users.languages,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (row) profile = row;

    subjectsList = await db()
      .select({ name: subjects.name })
      .from(userSubjects)
      .innerJoin(subjects, eq(userSubjects.subjectId, subjects.id))
      .where(eq(userSubjects.userId, session.user.id));
  } catch (error) {
    console.error("Profile load error:", error);
  }

  const initials =
    profile.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          My Profile
        </h1>
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link href="/settings">
            <Pencil className="h-3.5 w-3.5" />
            Edit Profile
          </Link>
        </Button>
      </div>

      {/* Avatar & Name */}
      <div className="flex flex-col items-center text-center space-y-3">
        <Avatar className="h-24 w-24">
          <AvatarImage
            src={profile.image ?? undefined}
            alt={profile.name ?? "Profile"}
          />
          <AvatarFallback className="text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">
            {profile.name || "Anonymous"}
          </h2>
          {profile.email && (
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="font-semibold text-foreground">Bio</h2>
          {profile.bio ? (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {profile.bio}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              No bio yet. Add one in{" "}
              <Link href="/settings" className="underline">
                settings
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>

      {/* Location */}
      {(profile.country || profile.timezone) && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold text-foreground">Location</h2>
            {profile.country && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {profile.country}
              </div>
            )}
            {profile.timezone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" /> {profile.timezone}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subjects */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-foreground">Subjects</h2>
          {subjectsList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {subjectsList.map((s, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1.5">
                  <BookOpen className="h-3 w-3" />
                  {s.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              No subjects yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold text-foreground">Languages</h2>
          {profile.languages && profile.languages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((lang, idx) => (
                <Badge key={idx} variant="secondary">
                  {languageName(lang)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              No languages set.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
