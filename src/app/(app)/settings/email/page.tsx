import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EmailSettings } from "@/components/settings/email-settings";

export const metadata: Metadata = {
  title: "Email — Settings — ChavrutaAnytime",
};

export default async function EmailPage() {
  const session = await auth();
  let email = session?.user?.email ?? "";

  if (session?.user?.id) {
    try {
      const [row] = await db()
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, session.user.id));
      if (row) email = row.email;
    } catch {
      // fall back to session email
    }
  }

  return <EmailSettings currentEmail={email} />;
}
