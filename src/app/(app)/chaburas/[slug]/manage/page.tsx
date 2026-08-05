import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/auth";
import { db } from "@/db";
import { chaburas, chaburaMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { ManageChaburaForm } from "@/components/chaburas/manage-chabura-form";

export const metadata: Metadata = { title: "Manage Chabura — ChavrutaAnytime" };

export default async function ManageChaburaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!session.user.onboardedAt) redirect("/onboarding");

  const { slug } = await params;
  const currentUserId = session.user.id;

  let chabura: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    image: string | null;
    isPublic: boolean | null;
  } | null = null;

  try {
    const [row] = await db()
      .select({
        id: chaburas.id,
        slug: chaburas.slug,
        name: chaburas.name,
        description: chaburas.description,
        image: chaburas.image,
        isPublic: chaburas.isPublic,
      })
      .from(chaburas)
      .where(eq(chaburas.slug, slug));

    if (!row) notFound();

    // Verify rosh
    const [membership] = await db()
      .select({ role: chaburaMembers.role })
      .from(chaburaMembers)
      .where(
        and(
          eq(chaburaMembers.chaburaId, row.id),
          eq(chaburaMembers.userId, currentUserId),
        ),
      );

    if (!membership || membership.role !== "rosh") {
      redirect(`/chaburas/${slug}`);
    }

    chabura = row;
  } catch (err) {
    console.error("Manage chabura load error:", err);
    notFound();
  }

  if (!chabura) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 -ml-2">
          <Link href={`/chaburas/${slug}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-foreground">
          Manage Chabura
        </h1>
      </div>

      <ManageChaburaForm
        chaburaId={chabura.id}
        slug={chabura.slug}
        initialName={chabura.name}
        initialDescription={chabura.description ?? ""}
        initialImage={chabura.image}
        initialIsPublic={chabura.isPublic ?? true}
      />
    </div>
  );
}
