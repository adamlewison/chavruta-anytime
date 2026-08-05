import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import {
  getUserChaburaMembershipIds,
  listMyChaburas,
  listDiscoverChaburas,
} from "@/server/queries/chaburas";
import { ChaburasList, type ChaburaRow } from "@/components/chaburas/chaburas-list";

export const metadata: Metadata = {
  title: "Chaburas — ChavrutaAnytime",
};

export default async function ChaburasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  if (!session.user.onboardedAt) {
    redirect("/onboarding");
  }

  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const userId = session.user.id;

  let myChaburas: ChaburaRow[] = [];
  let discover: ChaburaRow[] = [];

  try {
    const myIds = await getUserChaburaMembershipIds(userId);

    if (myIds.length > 0) {
      myChaburas = await listMyChaburas(myIds, query || undefined);
    }

    discover = await listDiscoverChaburas(myIds, query || undefined);
  } catch (error) {
    console.error("Chaburas list load error:", error);
  }

  return <ChaburasList query={query} myChaburas={myChaburas} discover={discover} />;
}
