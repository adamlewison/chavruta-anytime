import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SettingsForm } from "@/components/settings/settings-form";
import { AvatarUploadDialog } from "@/components/settings/avatar-upload-dialog";
import { DangerZone } from "@/components/settings/danger-zone";

export const metadata: Metadata = {
  title: "Public Profile — Settings — ChavrutaAnytime",
};

export default async function PublicProfilePage() {
  const session = await auth();

  let profile = {
    email: session?.user?.email ?? "",
    name: session?.user?.name ?? "",
    bio: "",
    country: "",
    timezone: "",
    image: null as string | null,
    gender: null as string | null,
    profileVisible: true,
  };

  if (session?.user?.id) {
    try {
      const [row] = await db()
        .select({
          email: users.email,
          name: users.name,
          bio: users.bio,
          country: users.country,
          timezone: users.timezone,
          image: users.image,
          gender: users.gender,
          profileVisible: users.profileVisible,
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
          gender: row.gender,
          profileVisible: row.profileVisible,
        };
      }
    } catch (error) {
      console.error("Settings load error:", error);
    }
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Public profile
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Manage the details other users see when they find you or learn with
            you.
          </p>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <AvatarUploadDialog
            currentImage={profile.image}
            name={profile.name}
          />
          <p className="text-xs text-muted-foreground">Update photo</p>
        </div>
      </section>

      <SettingsForm
        initialData={{
          name: profile.name,
          bio: profile.bio,
          profileVisible: profile.profileVisible,
          gender: profile.gender,
        }}
      />

      <DangerZone />
    </div>
  );
}
