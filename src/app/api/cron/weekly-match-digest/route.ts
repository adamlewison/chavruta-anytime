import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Placeholder - log and return success
  console.log("[weekly-match-digest] Digest scheduled at", new Date().toISOString());

  return NextResponse.json({ success: true, message: "Digest scheduled" });
}
