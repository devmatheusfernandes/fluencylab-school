import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    !session.user.role ||
    !["admin", "manager"].includes(session.user.role)
  ) {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 403 }
    );
  }

  try {
    const { paymentId } = await params;
    const body = await request.json();
    const { amount } = body;

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: "Valor inválido." },
        { status: 400 }
      );
    }

    const paymentRef = adminDb.collection("monthlyPayments").doc(paymentId);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      return NextResponse.json(
        { error: "Pagamento não encontrado." },
        { status: 404 }
      );
    }

    const paymentData = paymentDoc.data();

    // Check if status is pending
    if (paymentData?.status !== "pending") {
      return NextResponse.json(
        { error: "Apenas pagamentos pendentes podem ser alterados." },
        { status: 400 }
      );
    }

    // Update amount
    await paymentRef.update({
      amount: amount,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating payment amount:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar pagamento." },
      { status: 500 }
    );
  }
}
