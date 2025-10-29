// app/api/student/placement/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { placementService } from "@/services/placementService";
import { placementRepository } from "@/repositories";

// GET /api/student/placement - Get placement tests for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tests = await placementRepository.getPlacementTestsByUserId(
      session.user.id
    );
    const processedTests = placementService.processPlacementTests(tests);

    return NextResponse.json(processedTests);
  } catch (error: any) {
    console.error("Error fetching placement tests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
