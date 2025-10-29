import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { contractService } from "@/services/contractService";
import { adminDb } from "@/lib/firebase/admin";
import { CreateContractRequest } from "@/types/contract";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { signatureData, contractLengthMonths } = body;

    // Extract IP address from request headers
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = forwarded?.split(",")[0]?.trim() || realIp || "unknown";

    // Add IP and browser info to signature data
    const enhancedSignatureData = {
      ...signatureData,
      ip: clientIp,
      browser: request.headers.get("user-agent") || "unknown",
    };

    // Prepare the request for contract service
    const contractRequest: CreateContractRequest = {
      studentId: session.user.id,
      signatureData: enhancedSignatureData,
    };

    // Use the same contract service as the student contract page
    const result = await contractService.createContract(contractRequest);

    if (result.success) {
      // Also update the contract length in user document
      const userRef = adminDb.collection("users").doc(session.user.id);
      await userRef.update({
        contractLengthMonths: contractLengthMonths,
        contractStartDate: new Date(),
      });

      return NextResponse.json({
        success: true,
        contractStatus: result.data,
        message: "Contract signed successfully",
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
    console.error("Error signing contract:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
