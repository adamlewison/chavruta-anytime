import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chaburas, chaburaMembers } from "@/db/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { ChaburasView } from "@/components/connections/chaburas-view";
import type { ChaburaRow } from "@/components/chaburas/chaburas-table";

export default async function MyChaborasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id;

  let myChaburas: ChaburaRow[] = [];

  try {
    const myMemberships = await db()
      .select({ chaburaId: chaburaMembers.chaburaId })
      .from(chaburaMembers)
      .where(
        and(
          eq(chaburaMembers.userId, userId),
          inArray(chaburaMembers.role, ["rosh", "member"]),
        ),
      );

    const myIds = myMemberships.map((m) => m.chaburaId);

    if (myIds.length > 0) {
      const memberCountSql = sql<number>`(
        SELECT COUNT(*)::int FROM ${chaburaMembers}
        WHERE ${chaburaMembers.chaburaId} = ${chaburas.id}
          AND ${chaburaMembers.role} IN ('rosh', 'member')
      )`;

      myChaburas = await db()
        .select({
          id: chaburas.id,
          slug: chaburas.slug,
          name: chaburas.name,
          description: chaburas.description,
          image: chaburas.image,
          isPublic: chaburas.isPublic,
          memberCount: memberCountSql,
        })
        .from(chaburas)
        .where(inArray(chaburas.id, myIds))
        .orderBy(desc(chaburas.createdAt))
        .limit(50);
    }
  } catch (err) {
    console.error("Chaburas query error:", err);
  }

  return <ChaburasView chaburas={myChaburas} />;
}
