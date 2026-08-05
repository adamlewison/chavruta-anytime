import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { DateTime } from "luxon";
import { getAcceptedConnections, getUserChaburaIds } from "@/server/queries/dashboard";
import { listTestCallOccurrences } from "@/server/queries/calls";
import { TestCallClient } from "./test-call-client";

export const metadata: Metadata = { title: "Test Call Creation — ChavrutaAnytime" };
export const dynamic = "force-dynamic";

export default async function TestCallPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!session.user.onboardedAt) redirect("/onboarding");

  const userId = session.user.id;
  const now = DateTime.utc();

  const [connRows, chaburaIds] = await Promise.all([
    getAcceptedConnections(userId),
    getUserChaburaIds(userId),
  ]);

  const connIds = connRows.map((c) => c.id);

  const rows = await listTestCallOccurrences(userId, connIds, chaburaIds, now.toJSDate());

  const occurrences = rows.map((r) => ({
    ...r,
    startsAt: r.startsAt.toISOString(),
    endsAt: r.endsAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6 pb-24">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Test Call Creation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {occurrences.length} upcoming session occurrence{occurrences.length !== 1 ? "s" : ""}
        </p>
      </div>
      <TestCallClient
        occurrences={occurrences}
        userName={session.user.name ?? "Member"}
      />
    </div>
  );
}
