import { StreamClient } from "@stream-io/node-sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type StreamUserPayload = {
  id: string;
  name?: string;
  image?: string;
  role: "admin" | "user";
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["admin", "manager"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const streamSecret = process.env.STREAM_SECRET;

    if (!apiKey || !streamSecret) {
      return NextResponse.json(
        { error: "Missing Stream credentials" },
        { status: 500 },
      );
    }

    const serverClient = new StreamClient(apiKey, streamSecret);
    const body = await request.json();
    const { users } = body;

    if (!users || !Array.isArray(users)) {
      return NextResponse.json(
        { error: "Invalid users array" },
        { status: 400 },
      );
    }

    if (users.length > 500) {
      return NextResponse.json({ error: "Too many users" }, { status: 413 });
    }

    // Map users to Stream format if needed, ensuring required fields
    const streamUsers: StreamUserPayload[] = users
      .map((u: any) => {
        const id = typeof u?.id === "string" ? u.id.trim() : "";
        if (!id) return null;

        const name = typeof u?.name === "string" ? u.name : undefined;
        const image = typeof u?.image === "string" ? u.image : undefined;
        const role: StreamUserPayload["role"] =
          u?.role === "admin" ? "admin" : "user";

        return {
          id,
          ...(name ? { name } : {}),
          ...(image ? { image } : {}),
          role,
        };
      })
      .filter((u): u is StreamUserPayload => u !== null);

    if (streamUsers.length === 0) {
      return NextResponse.json({ error: "No valid users" }, { status: 400 });
    }

    await serverClient.upsertUsers(streamUsers);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error syncing users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
