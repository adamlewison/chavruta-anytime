import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, userSubjects, subjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Globe, BookOpen, Clock } from "lucide-react";
import { languageName } from "@/lib/languages";
import { popcountHours } from "@/lib/availability";

export const metadata: Metadata = {
  title: "Profile — ChavrutaAnytime",
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { userId } = await params;

  if (userId === session.user.id) {
    redirect("/profile");
  }

  let user: {
    name: string | null;
    image: string | null;
    bio: string | null;
    country: string | null;
    timezone: string | null;
    languages: string[] | null;
    availability: Buffer | null;
  } | null = null;

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
        availability: users.availability,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!row) notFound();
    user = row;

    subjectsList = await db()
      .select({ name: subjects.name })
      .from(userSubjects)
      .innerJoin(subjects, eq(userSubjects.subjectId, subjects.id))
      .where(eq(userSubjects.userId, userId));
  } catch (error) {
    console.error("Public profile load error:", error);
    notFound();
  }

  if (!user) notFound();

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  // Availability summary — aggregate hours only, no exact bitmap exposure (spec §8.1 /profile/[userId])
  let availHoursPerWeek: number | null = null;
  let availDaySummary: string | null = null;

  if (user.availability) {
    const bitmap = new Uint8Array(user.availability);
    availHoursPerWeek = popcountHours(bitmap);

    // Coarse day-of-week summary: which days have any set bits?
    // Bit layout: bit i = day floor(i/48) + slot (i%48). Day 0=Sun, 6=Sat.
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const activeDays: string[] = [];
    for (let day = 0; day < 7; day++) {
      let hasSlot = false;
      for (let slot = 0; slot < 48; slot++) {
        const bitIndex = day * 48 + slot;
        const byteIndex = Math.floor(bitIndex / 8);
        const bitOffset = 7 - (bitIndex % 8);
        if (bitmap[byteIndex] & (1 << bitOffset)) {
          hasSlot = true;
          break;
        }
      }
      if (hasSlot) activeDays.push(DAY_NAMES[day]);
    }

    if (activeDays.length > 0) {
      // Group consecutive days
      const weekdays = activeDays.filter((d) =>
        ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(d),
      );
      const weekend = activeDays.filter((d) => ["Sat", "Sun"].includes(d));

      const parts: string[] = [];
      if (weekdays.length >= 4) parts.push("most weekdays");
      else if (weekdays.length > 0) parts.push(`${weekdays.join(", ")}`);
      if (weekend.length === 2) parts.push("weekends");
      else if (weekend.length === 1) parts.push(weekend[0]);
      availDaySummary = `Available ${parts.join(" & ")}`;
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      {/* Avatar & Name */}
      <div className="flex flex-col items-center text-center space-y-3">
        <Avatar className="h-24 w-24">
          <AvatarImage
            src={user.image ?? undefined}
            alt={user.name ?? "Profile"}
          />
          <AvatarFallback className="text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold text-foreground">
          {user.name || "Anonymous"}
        </h2>
      </div>

      {/* Bio */}
      {user.bio && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold text-foreground">Bio</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {user.bio}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Location — country only (no timezone, no post code) */}
      {user.country && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold text-foreground">Location</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {user.country}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability — aggregate hours + coarse day summary only (no exact bitmap) */}
      {(availHoursPerWeek !== null || availDaySummary) && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold text-foreground">Availability</h2>
            {availHoursPerWeek !== null && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {availHoursPerWeek}h available per week
              </div>
            )}
            {availDaySummary && (
              <p className="text-sm text-muted-foreground">{availDaySummary}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subjects */}
      {subjectsList.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-foreground">Subjects</h2>
            <div className="flex flex-wrap gap-2">
              {subjectsList.map((s, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1.5">
                  <BookOpen className="h-3 w-3" />
                  {s.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Languages */}
      {user.languages && user.languages.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-foreground">Languages</h2>
            <div className="flex flex-wrap gap-2">
              {user.languages.map((lang, idx) => (
                <Badge key={idx} variant="secondary">
                  {languageName(lang)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
