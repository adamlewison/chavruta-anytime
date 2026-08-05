import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileHeader } from "@/components/profile/profile-header";
import { Pencil, BookOpen } from "lucide-react";
import { getOwnProfile, getUserSubjectNames } from "@/server/queries/users";

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
    const row = await getOwnProfile(session.user.id);

    if (row) profile = row;

    subjectsList = await getUserSubjectNames(session.user.id);
  } catch (error) {
    console.error("Profile load error:", error);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <ProfileHeader
        name={profile.name}
        image={profile.image}
        bio={profile.bio}
        country={profile.country}
        languages={profile.languages}
      />

      {/* Action row */}
      <Button variant="outline" size="sm" className="gap-2 w-full" asChild>
        <Link href="/settings">
          <Pencil className="h-3.5 w-3.5" />
          Edit Profile
        </Link>
      </Button>

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
            <p className="text-sm italic text-muted-foreground">No subjects yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
