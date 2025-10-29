import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { contractRepository } from "@/repositories";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has an existing signed contract
    const contractStatus = await contractRepository.getContractStatus(
      session.user.id
    );

    if (contractStatus && contractStatus.isValid && contractStatus.signedAt) {
      return NextResponse.json({
        contractSigned: true,
        contractData: contractStatus,
        message: "Contract already signed",
      });
    } else {
      return NextResponse.json({
        contractSigned: false,
        message: "No signed contract found",
      });
    }
  } catch (error) {
    console.error("Error checking contract status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
