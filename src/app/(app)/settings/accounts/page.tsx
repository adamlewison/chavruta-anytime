import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ConnectedAccounts } from "@/components/settings/connected-accounts";

export const metadata: Metadata = {
  title: "Connected Accounts — Settings — ChavrutaAnytime",
};

export default async function AccountsPage() {
  const session = await auth();

  let email = session?.user?.email ?? "";
  let linkedAccounts: { provider: string; providerAccountId: string }[] = [];

  if (session?.user?.id) {
    try {
      const [userRow] = await db()
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, session.user.id));

      if (userRow) email = userRow.email;

      linkedAccounts = await db()
        .select({
          provider: accounts.provider,
          providerAccountId: accounts.providerAccountId,
        })
        .from(accounts)
        .where(eq(accounts.userId, session.user.id));
    } catch {
      // fall through with empty defaults
    }
  }

  return (
    <ConnectedAccounts linkedAccounts={linkedAccounts} userEmail={email} />
  );
}
