// app/api/admin/announcements/route.ts
import { NextResponse } from "next/server";
import { AnnouncementService } from "@/services/announcementService";
import { UserRoles } from "@/types/users/userRoles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const announcementService = new AnnouncementService();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRoles.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const announcements = await announcementService.getAllAnnouncements();
    return NextResponse.json(announcements);
  } catch (error: unknown) {
    console.error("Error fetching announcements:", error);
    // More detailed error logging
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : "Unknown";
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      name: errorName,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRoles.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, message, type, recipientType, roles, userIds } = body;

    const announcement = await announcementService.createAnnouncement(
      title,
      message,
      type,
      session.user.id, // Use session user ID instead of decoded token
      recipientType,
      roles,
      userIds
    );

    return NextResponse.json(announcement, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating announcement:", error);
    // More detailed error logging
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : "Unknown";
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      name: errorName,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
