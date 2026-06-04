import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { connections } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { ConnectionsNav } from "@/components/connections/connections-nav";

export const metadata: Metadata = {
  title: "My Network — ChavrutaAnytime",
};

export default async function ConnectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!session.user.onboardedAt) redirect("/onboarding");

  const userId = session.user.id;

  let pendingCount = 0;
  try {
    const [row] = await db()
      .select({ n: count() })
      .from(connections)
      .where(and(eq(connections.addresseeId, userId), eq(connections.status, "pending")));
    pendingCount = row?.n ?? 0;
  } catch {
    // fall through
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Network</h1>
      <div className="md:flex md:gap-8 md:items-start">
        <ConnectionsNav pendingCount={pendingCount} />
        <div className="flex-1 min-w-0 mt-4 md:mt-0">{children}</div>
      </div>
    </div>
  );
}
