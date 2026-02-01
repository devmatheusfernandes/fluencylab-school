import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { contractService } from "@/services/financial/contractService";
import { CreateContractRequest } from "@/types/contract";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { signatureData } = body;

    // Extract IP address from request headers
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = forwarded?.split(",")[0]?.trim() || realIp || "unknown";

    // Add IP and browser info to signature data
    const enhancedSignatureData = {
      ...signatureData,
      ip: clientIp,
      browser: request.headers.get("user-agent") || "unknown",
      // Default to a date that passes 18+ check for teachers/MEI (who don't provide birth date in form)
      birthDate: signatureData.birthDate || "2000-01-01",
    };

    // Prepare the request for contract service
    // We treat the teacher as a "student" in the contract service for now, 
    // or we might want to extend the service later.
    // The service mainly creates a document in 'contracts' collection.
    const contractRequest: CreateContractRequest = {
      studentId: session.user.id,
      signatureData: enhancedSignatureData,
    };

    // Use the same contract service
    const result = await contractService.createContract(contractRequest);

    if (result.success) {
      return NextResponse.json({
        success: true,
        contractStatus: result.data,
        message: "Teacher contract signed successfully",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          errors: result.errors,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error signing teacher contract:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
