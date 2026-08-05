import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getChaburaMembershipRole } from "@/server/queries/chaburas";
import { updateChaburaImage } from "@/server/actions/chaburas";

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
  const role = await getChaburaMembershipRole(chaburaId, session.user.id);

  if (role !== "rosh") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const blob = await put(`chaburas/${chaburaId}/${filename}`, request.body!, {
    access: "public",
  });

  await updateChaburaImage(chaburaId, blob.url);

  return NextResponse.json(blob);
}
