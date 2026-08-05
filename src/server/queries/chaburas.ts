import { db } from "@/db";
import { chaburas } from "@/db/schema";
import { eq } from "drizzle-orm";

/** True when the slug is free for a new chabura. */
export async function isChaburaSlugAvailable(slug: string) {
  const [existing] = await db()
    .select({ id: chaburas.id })
    .from(chaburas)
    .where(eq(chaburas.slug, slug))
    .limit(1);
  return !existing;
}
