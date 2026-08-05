import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isChaburaSlugAvailable } from "@/server/queries/chaburas";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const available = await isChaburaSlugAvailable(slug);

  return NextResponse.json({ available });
}
