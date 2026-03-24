import { StreamClient } from "@stream-io/node-sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    if (!apiKey) {
      //console.error('API key is missing.');
      return NextResponse.json(
        { error: "Missing Stream API key" },
        { status: 500 },
      );
    }

    const streamSecret = process.env.STREAM_SECRET;
    if (!streamSecret) {
      //console.error('Stream secret is missing.');
      return NextResponse.json(
        { error: "Missing Stream secret" },
        { status: 500 },
      );
    }

    const serverClient = new StreamClient(apiKey, streamSecret);
    const body = await request.json();

    const requestedUserId = body?.userId;
    const isPrivileged = ["admin", "manager"].includes(session.user.role ?? "");

    const targetUserId =
      typeof requestedUserId === "string" && requestedUserId.trim()
        ? requestedUserId.trim()
        : session.user.id;

    if (!isPrivileged && targetUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      !targetUserId ||
      typeof targetUserId !== "string" ||
      targetUserId.trim() === ""
    ) {
      //console.error('Invalid user ID:', userId);
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const token = serverClient.generateUserToken({
      user_id: targetUserId,
      iat: Math.floor(Date.now() / 1000) - 60,
    });

    return NextResponse.json({ userId: targetUserId, token });
  } catch (error) {
    //console.error('Error generating token:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
