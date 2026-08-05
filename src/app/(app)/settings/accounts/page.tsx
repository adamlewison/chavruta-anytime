import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { getUserEmail, getLinkedAccounts } from "@/server/queries/users";
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
      const userEmail = await getUserEmail(session.user.id);
      if (userEmail) email = userEmail;

      linkedAccounts = await getLinkedAccounts(session.user.id);
    } catch {
      // fall through with empty defaults
    }
  }

  return (
    <ConnectedAccounts linkedAccounts={linkedAccounts} userEmail={email} />
  );
}
