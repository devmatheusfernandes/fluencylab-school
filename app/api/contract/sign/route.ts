import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { contractService } from "@/services/contractService";
import { CreateContractRequest } from "@/types/contract";

// POST /api/contract/sign - Sign a contract
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateContractRequest = await request.json();

    // Validate that user is signing their own contract
    if (session.user.id !== body.studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get client IP from headers
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(/, /)[0]
      : request.headers.get("x-real-ip") || "Unknown";

    // Get user agent
    const userAgent = request.headers.get("user-agent") || "Unknown";

    // Add client info to signature data
    body.signatureData.ip = ip;
    body.signatureData.browser = userAgent;

    const result = await contractService.createContract(body);

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Error in contract sign:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
