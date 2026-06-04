import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomName, userName } = await req.json();

  if (!roomName || typeof roomName !== "string") {
    return NextResponse.json({ error: "roomName is required" }, { status: 400 });
  }

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    {
      identity: session.user.id,
      name: userName ?? session.user.name ?? "Member",
    },
  );

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return NextResponse.json({ token: await at.toJwt() });
}
