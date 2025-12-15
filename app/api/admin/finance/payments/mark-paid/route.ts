import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const monthlyPaymentId = String(payload.monthlyPaymentId || "").trim();

    // Case 1: Mark an existing monthly payment as PAID and update subscription progress
    if (monthlyPaymentId) {
      const paymentRef = adminDb.collection("monthlyPayments").doc(monthlyPaymentId);
      const snap = await paymentRef.get();
      if (!snap.exists) {
        return NextResponse.json({ error: "Mensalidade não encontrada." }, { status: 404 });
      }
      const payment = snap.data() as any;
      const subscriptionId = String(payment.subscriptionId || "");
      const userId = String(payment.userId || "");
      if (!subscriptionId || !userId) {
        return NextResponse.json({ error: "Registro de mensalidade inválido." }, { status: 400 });
      }

      const overrideAmount = Number(payload.amount || 0);
      const overrideMethod = (payload.paymentMethod as string) || undefined;
      const overrideDescription = (payload.description as string) || undefined;
      const updates: Record<string, any> = {};
      if (Number.isFinite(overrideAmount) && overrideAmount > 0) {
        updates.amount = overrideAmount;
      }
      if (overrideMethod) updates.paymentMethod = overrideMethod;
      if (overrideDescription !== undefined) updates.description = overrideDescription;

      const now = new Date();
      await paymentRef.update({
        ...updates,
        status: "paid",
        paidAt: now,
        updatedAt: now,
      });

      const subRef = adminDb.collection("subscriptions").doc(subscriptionId);
      const subSnap = await subRef.get();
      if (subSnap.exists) {
        const sub = subSnap.data() as any;
        const current = Number(sub.paymentsCompleted || 0);
        const total = Number(sub.totalPayments || 0);
        const nextCompleted = Math.min(total || current + 1, current + 1);
        await subRef.update({
          paymentsCompleted: nextCompleted,
          status: nextCompleted >= total && total > 0 ? "canceled" : "active",
        });
        await adminDb.collection("users").doc(userId).update({
          subscriptionStatus: nextCompleted >= total && total > 0 ? "canceled" : "active",
        });
      }
      return NextResponse.json({ id: monthlyPaymentId, updated: true }, { status: 200 });
    }

    // Case 2: Create a manual payment record (not linked to subscription)
    const studentId = String(payload.studentId || "").trim();
    const amount = Number(payload.amount || 0);
    const currency = (payload.currency as string) || "BRL";
    const paymentMethod = (payload.paymentMethod as string) || "cash";
    const dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
    const description = (payload.description as string) || "Mensalidade paga manualmente";

    if (!studentId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const doc: any = {
      studentId,
      amount,
      currency,
      status: "paid",
      paymentMethod,
      description,
      dueDate,
      paidAt: new Date(),
      createdAt: new Date(),
      manual: true,
    };

    const ref = await adminDb.collection("monthlyPayments").add(doc);
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
