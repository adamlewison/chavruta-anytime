import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { getUserEmail } from "@/server/queries/users";
import { EmailSettings } from "@/components/settings/email-settings";

export const metadata: Metadata = {
  title: "Email — Settings — ChavrutaAnytime",
};

export default async function EmailPage() {
  const session = await auth();
  let email = session?.user?.email ?? "";

  if (session?.user?.id) {
    try {
      const row = await getUserEmail(session.user.id);
      if (row) email = row;
    } catch {
      // fall back to session email
    }
  }

  return <EmailSettings currentEmail={email} />;
}
