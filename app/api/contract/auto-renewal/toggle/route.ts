import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { contractService } from "@/services/contractService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid 'enabled' parameter" },
        { status: 400 }
      );
    }

    const result = await contractService.toggleAutoRenewal(
      session.user.id,
      enabled
    );

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error toggling auto-renewal:", error);
    return NextResponse.json(
      { success: false, message: "Failed to toggle auto-renewal" },
      { status: 500 }
    );
  }
}
