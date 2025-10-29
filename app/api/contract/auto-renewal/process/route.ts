import { NextRequest, NextResponse } from "next/server";
import { contractService } from "@/services/contractService";

export async function POST(request: NextRequest) {
  try {
    // Verify the request is coming from a cron job or authorized source
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Não autorizado" },
        { status: 401 }
      );
    }

    console.log("Starting automatic contract renewal processing...");

    // Process all contracts for renewal
    const renewalJobs = await contractService.processContractRenewals();

    const processedCount = renewalJobs.filter(job => job.shouldRenew).length;
    const eligibleForCancellation = renewalJobs.filter(job => job.shouldShowCancelButton).length;

    console.log(`Contract renewal processing completed:
      - Total contracts processed: ${renewalJobs.length}
      - Contracts renewed: ${processedCount}
      - Contracts eligible for cancellation: ${eligibleForCancellation}
    `);

    return NextResponse.json({
      success: true,
      message: "Processamento de renovações concluído",
      data: {
        totalProcessed: renewalJobs.length,
        contractsRenewed: processedCount,
        eligibleForCancellation,
        processedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Error processing contract renewals:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Erro ao processar renovações de contratos",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // This endpoint can be used to check the status of renewal processing
    // without actually triggering the process
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Não autorizado" },
        { status: 401 }
      );
    }

    // Get renewal jobs without processing them
    const renewalJobs = await contractService.processContractRenewals();
    
    const eligibleForRenewal = renewalJobs.filter(job => job.shouldRenew).length;
    const eligibleForCancellation = renewalJobs.filter(job => job.shouldShowCancelButton).length;

    return NextResponse.json({
      success: true,
      message: "Status de renovações obtido",
      data: {
        totalContracts: renewalJobs.length,
        eligibleForRenewal,
        eligibleForCancellation,
        checkedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Error checking renewal status:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Erro ao verificar status de renovações",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}