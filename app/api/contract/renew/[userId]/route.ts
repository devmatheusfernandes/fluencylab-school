import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { contractService } from "@/services/financial/contractService";

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
    
    // Only admins and managers can renew other users' contracts
    const isAdmin =
      session.user.role === "admin" || session.user.role === "manager";

    if (!isAdmin) {
        return NextResponse.json(
            { success: false, message: "Apenas administradores podem renovar contratos manualmente." },
            { status: 403 }
        );
    }

    const result = await contractService.renewContract({
      studentId: userId,
      renewalType: "manual",
      adminId: session.user.id,
    });

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Error renewing contract:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
