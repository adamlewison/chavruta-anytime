import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/db";
import { subjects, users, chaburas, connections } from "@/db/schema";
import { asc, eq, or, and } from "drizzle-orm";
import { NewSessionForm } from "./new-session-form";

export const metadata: Metadata = {
  title: "Create Session",
};

export type SessionContext =
  | { type: "chabura"; id: string; name: string; image: string | null; slug: string }
  | { type: "chavruta"; connectionId: string; partnerId: string; name: string; image: string | null };

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

  const [allSubjects, userRow, sessionContext] = await Promise.all([
    db()
      .select({ slug: subjects.slug, name: subjects.name })
      .from(subjects)
      .orderBy(asc(subjects.sortOrder), asc(subjects.name)),

    db()
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, session.user.id))
      .then((r) => r[0]),

    (async (): Promise<SessionContext | null> => {
      if (chaburaId) {
        const [row] = await db()
          .select({ id: chaburas.id, name: chaburas.name, image: chaburas.image, slug: chaburas.slug })
          .from(chaburas)
          .where(eq(chaburas.id, chaburaId));
        if (!row) return null;
        return { type: "chabura", ...row };
      }
      if (connectionId) {
        const [conn] = await db()
          .select({
            id: connections.id,
            requesterId: connections.requesterId,
            addresseeId: connections.addresseeId,
          })
          .from(connections)
          .where(
            and(
              eq(connections.id, connectionId),
              or(
                eq(connections.requesterId, session.user.id),
                eq(connections.addresseeId, session.user.id),
              ),
            ),
          );
        if (!conn) return null;
        const partnerId =
          conn.requesterId === session.user.id ? conn.addresseeId : conn.requesterId;
        const [partner] = await db()
          .select({ name: users.name, image: users.image })
          .from(users)
          .where(eq(users.id, partnerId));
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
        userTimezone={userRow?.timezone ?? "UTC"}
        sessionContext={sessionContext}
      />
    </Suspense>
  );
}
