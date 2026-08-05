import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SettingsNav } from "@/components/settings/settings-nav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (!session.user.onboardedAt) {
    redirect("/onboarding");
  }

  let name = session.user.name ?? "";
  let image: string | null = null;

  try {
    const [row] = await db()
      .select({ name: users.name, image: users.image })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (row) {
      name = row.name ?? "";
      image = row.image;
    }
  } catch {
    // fall through to session defaults
  }

  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      {/* Header: avatar + name */}
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 shrink-0">
          <AvatarImage src={image ?? undefined} alt={name} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground leading-tight">{name}</p>
          <p className="text-sm text-muted-foreground">Your personal profile</p>
        </div>
      </div>

      {/*
        SettingsNav renders two internal elements:
        - md:hidden  → mobile horizontal tabs (block on mobile, hidden on desktop)
        - hidden md:flex → desktop sidebar (hidden on mobile, flex item on desktop)
        Wrapping both in a flex row makes the desktop sidebar sit beside the content.
      */}
      <div className="md:flex md:gap-8 md:items-start">
        <SettingsNav />
        <div className="flex-1 min-w-0 mt-4 md:mt-0">{children}</div>
      </div>
    </div>
  );
}
