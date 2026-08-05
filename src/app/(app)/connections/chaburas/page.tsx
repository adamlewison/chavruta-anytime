import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getUserChaburaMembershipIds, listMyChaburas } from "@/server/queries/chaburas";
import { ChaburasView } from "@/components/connections/chaburas-view";
import type { ChaburaRow } from "@/components/chaburas/chaburas-table";

export default async function MyChaborasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id;

  let myChaburas: ChaburaRow[] = [];

  try {
    const myIds = await getUserChaburaMembershipIds(userId);

    if (myIds.length > 0) {
      myChaburas = await listMyChaburas(myIds);
    }
  } catch (err) {
    console.error("Chaburas query error:", err);
  }

  return <ChaburasView chaburas={myChaburas} />;
}
