import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chaburas, chaburaMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");
  const chaburaId = searchParams.get("chaburaId");

  if (!filename || !chaburaId) {
    return NextResponse.json(
      { error: "filename and chaburaId are required" },
      { status: 400 },
    );
  }

  // Verify the user is rosh of this chabura
  const [membership] = await db()
    .select({ role: chaburaMembers.role })
    .from(chaburaMembers)
    .where(
      and(
        eq(chaburaMembers.chaburaId, chaburaId),
        eq(chaburaMembers.userId, session.user.id),
      ),
    );

  if (!membership || membership.role !== "rosh") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const blob = await put(`chaburas/${chaburaId}/${filename}`, request.body!, {
    access: "public",
  });

  await db()
    .update(chaburas)
    .set({ image: blob.url, updatedAt: new Date() })
    .where(eq(chaburas.id, chaburaId));

  return NextResponse.json(blob);
}
