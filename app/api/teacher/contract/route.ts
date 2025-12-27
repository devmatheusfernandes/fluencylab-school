import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { contractService } from "@/services/contractService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const contractData = await contractService.getContractPDFData(userId);

    return NextResponse.json(contractData);
  } catch (error) {
    console.error("Error fetching contract data:", error);
    return NextResponse.json(
      { error: "Failed to fetch contract data" },
      { status: 500 }
    );
  }
}
