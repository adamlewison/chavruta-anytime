import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { chaburas } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const [existing] = await db()
    .select({ id: chaburas.id })
    .from(chaburas)
    .where(eq(chaburas.slug, slug))
    .limit(1);

  return NextResponse.json({ available: !existing });
}
