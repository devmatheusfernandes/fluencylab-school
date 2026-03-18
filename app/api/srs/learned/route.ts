import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getActivePlanId, getLearnedItemsDetails } from "@/actions/srsActions";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const planId = await getActivePlanId(session.user.id);
    if (!planId) {
      return NextResponse.json({ items: [] });
    }

    const items = await getLearnedItemsDetails(planId);
    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
