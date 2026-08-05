import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listSubjectSlugs } from "@/server/queries/subjects";
import { getUserTimezone, getUserHeader } from "@/server/queries/users";
import { getChaburaContextInfo } from "@/server/queries/chaburas";
import { getConnectionForUser } from "@/server/queries/connections";
import { NewSessionForm } from "./new-session-form";
import type { SessionContext } from "./types";

export const metadata: Metadata = {
  title: "Create Session",
};

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!session.user.onboardedAt) redirect("/onboarding");

  const params = await searchParams;
  const chaburaId = typeof params.chaburaId === "string" ? params.chaburaId : undefined;
  const connectionId = typeof params.with === "string" ? params.with : undefined;

  const [allSubjects, userTimezone, sessionContext] = await Promise.all([
    listSubjectSlugs(),

    getUserTimezone(session.user.id),

    (async (): Promise<SessionContext | null> => {
      if (chaburaId) {
        const row = await getChaburaContextInfo(chaburaId);
        if (!row) return null;
        return { type: "chabura", ...row };
      }
      if (connectionId) {
        const conn = await getConnectionForUser(connectionId, session.user.id);
        if (!conn) return null;
        const partnerId =
          conn.requesterId === session.user.id ? conn.addresseeId : conn.requesterId;
        const partner = await getUserHeader(partnerId);
        if (!partner) return null;
        return {
          type: "chavruta",
          connectionId,
          partnerId,
          name: partner.name ?? "Your chavruta",
          image: partner.image,
        };
      }
      return null;
    })(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
      }
    >
      <NewSessionForm
        subjects={allSubjects}
        userTimezone={userTimezone ?? "UTC"}
        sessionContext={sessionContext}
      />
    </Suspense>
  );
}
