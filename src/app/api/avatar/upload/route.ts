import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { updateUserAvatarImage } from "@/server/actions/avatar";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");
  if (!filename) {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }

  const blob = await put(`avatars/${session.user.id}/${filename}`, request.body!, {
    access: "public",
  });

  await updateUserAvatarImage(session.user.id, blob.url);

  return NextResponse.json(blob);
}
