import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { contractService } from "@/services/contractService";
import { ContractCancellationRequest } from "@/types/contract";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Não autorizado" },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const body = await request.json();
    const { reason, isAdminCancellation } = body;

    // Check if user can cancel their own contract or if it's an admin cancellation
    const isOwnContract = session.user.id === userId;
    const isAdmin =
      session.user.role === "admin" || session.user.role === "manager";

    if (!isOwnContract && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Não autorizado para cancelar este contrato",
        },
        { status: 403 }
      );
    }

    // If it's a user cancelling their own contract, check if they're within the 30-day window
    if (isOwnContract && !isAdmin) {
      const canCancel = await contractService.canUserCancelContract(userId);
      if (!canCancel) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Cancelamento só é permitido até 30 dias antes do vencimento",
          },
          { status: 400 }
        );
      }
    }

    const cancellationRequest: ContractCancellationRequest = {
      studentId: userId,
      cancelledBy: session.user.id,
      reason: reason || "Cancelamento solicitado pelo usuário",
      isAdminCancellation: isAdmin && !isOwnContract,
    };

    const result = await contractService.cancelContract(cancellationRequest);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Error cancelling contract:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Não autorizado" },
        { status: 401 }
      );
    }

    const { userId } = await params;

    // Check if user can access this information
    const isOwnContract = session.user.id === userId;
    const isAdmin =
      session.user.role === "admin" || session.user.role === "manager";

    if (!isOwnContract && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Não autorizado" },
        { status: 403 }
      );
    }

    // Check if user can cancel their contract (30 days before expiration)
    const canCancel = await contractService.canUserCancelContract(userId);

    return NextResponse.json({
      success: true,
      canCancel,
      message: canCancel
        ? "Cancelamento permitido"
        : "Cancelamento não permitido neste momento",
    });
  } catch (error) {
    console.error("Error checking cancellation eligibility:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
