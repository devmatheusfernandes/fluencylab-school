import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { contractService } from "@/services/financial/contractService";
import { AdminSignContractRequest } from "@/types/contract";

// POST /api/admin/contracts/sign - Admin sign a contract
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AdminSignContractRequest = await request.json();

    // Get client IP from headers
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(/, /)[0]
      : request.headers.get("x-real-ip") || "Unknown";

    // Get user agent
    const userAgent = request.headers.get("user-agent") || "Unknown";

    // Add client info to admin data
    body.adminData.ip = ip;
    body.adminData.browser = userAgent;

    const result = await contractService.adminSignContract(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in admin contract sign:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
