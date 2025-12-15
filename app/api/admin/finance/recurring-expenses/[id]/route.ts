import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const update: Record<string, any> = {};
    if (body.name !== undefined) update.name = String(body.name || "");
    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
      }
      update.amount = amount;
    }
    if (body.currency !== undefined) update.currency = String(body.currency || "BRL");
    if (body.frequency !== undefined) {
      const freq = String(body.frequency);
      if (!["monthly", "yearly"].includes(freq)) {
        return NextResponse.json({ error: "Frequência inválida." }, { status: 400 });
      }
      update.frequency = freq;
    }
    if (body.nextOccurrence !== undefined) {
      update.nextOccurrence =
        typeof body.nextOccurrence === "string"
          ? new Date(body.nextOccurrence)
          : body.nextOccurrence instanceof Date
          ? body.nextOccurrence
          : new Date();
    }
    if (body.endDate !== undefined) {
      update.endDate =
        body.endDate === null
          ? null
          : typeof body.endDate === "string"
          ? new Date(body.endDate)
          : body.endDate instanceof Date
          ? body.endDate
          : null;
    }
    if (body.category !== undefined) update.category = String(body.category || "");
    if (body.variable !== undefined) update.variable = !!body.variable;
    if (body.estimationMethod !== undefined) update.estimationMethod = body.estimationMethod ? String(body.estimationMethod) : null;
    update.updatedAt = new Date();
    await adminDb.collection("recurringExpenses").doc(id).set(update, { merge: true });
    const doc = await adminDb.collection("recurringExpenses").doc(id).get();
    return NextResponse.json({ id, ...doc.data() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }
  try {
    const { id } = await params;
    await adminDb.collection("recurringExpenses").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
