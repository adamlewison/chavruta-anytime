import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SettingsForm } from "@/components/settings/settings-form";
import { DangerZone } from "@/components/settings/danger-zone";
import { AvatarUploadDialog } from "@/components/settings/avatar-upload-dialog";
import { AvailabilityEditor } from "@/components/settings/availability-editor";

export const metadata: Metadata = {
  title: "Settings — ChavrutaAnytime",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (!session.user.onboardedAt) {
    redirect("/onboarding");
  }

  let profile = {
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    bio: "",
    country: "",
    timezone: "",
    image: null as string | null,
    availabilityBase64: null as string | null,
  };

  try {
    const [row] = await db()
      .select({
        email: users.email,
        name: users.name,
        bio: users.bio,
        country: users.country,
        timezone: users.timezone,
        image: users.image,
        availability: users.availability,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (row) {
      profile = {
        email: row.email ?? "",
        name: row.name ?? "",
        bio: row.bio ?? "",
        country: row.country ?? "",
        timezone: row.timezone ?? "",
        image: row.image,
        availabilityBase64: row.availability
          ? Buffer.from(row.availability).toString("base64")
          : null,
      };
    }
  } catch (error) {
    console.error("Settings load error:", error);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Profile picture */}
      <div className="flex flex-col items-center gap-3">
        <AvatarUploadDialog currentImage={profile.image} name={profile.name} />
        <p className="text-xs text-muted-foreground">
          Tap to update your profile picture
        </p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            To change your email, contact support.
          </p>
        </CardContent>
      </Card>

      {/* Profile (editable) */}
      <SettingsForm
        initialData={{
          name: profile.name,
          bio: profile.bio,
          country: profile.country,
          timezone: profile.timezone,
        }}
      />

      {/* Availability */}
      <AvailabilityEditor
        initialBitmapBase64={profile.availabilityBase64}
        timezone={profile.timezone}
      />

      {/* Sign Out + Delete */}
      <DangerZone />
    </div>
  );
}
