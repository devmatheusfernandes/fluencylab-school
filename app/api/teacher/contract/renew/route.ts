import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { contractService } from "@/services/financial/contractService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { renewalType } = body; // 'automatic' or 'manual'

    const result = await contractService.renewContract({
        studentId: userId,
        renewalType: renewalType || 'manual',
    });

    if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error renewing contract:", error);
    return NextResponse.json(
      { error: "Failed to renew contract" },
      { status: 500 }
    );
  }
}
