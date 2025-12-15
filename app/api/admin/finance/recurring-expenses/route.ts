import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }
  try {
    const snap = await adminDb.collection("recurringExpenses").orderBy("nextOccurrence", "desc").get();
    const items = snap.docs.map((doc) => {
      const d = doc.data() as any;
      return {
        id: doc.id,
        name: d.name,
        amount: Number(d.amount || 0),
        currency: d.currency || "BRL",
        frequency: d.frequency || "monthly",
        nextOccurrence: d.nextOccurrence?.toDate?.() ?? (typeof d.nextOccurrence === "string" ? new Date(d.nextOccurrence) : d.nextOccurrence),
        endDate: (d.endDate?.toDate?.() ?? (typeof d.endDate === "string" ? new Date(d.endDate) : d.endDate)) ?? null,
        category: d.category || "",
        variable: !!d.variable,
        estimationMethod: d.estimationMethod || null,
        createdAt: d.createdAt?.toDate?.() ?? new Date(d.createdAt || Date.now()),
        updatedAt: d.updatedAt?.toDate?.() ?? new Date(d.updatedAt || Date.now()),
      };
    });
    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const amount = Number(body.amount);
    const currency = String(body.currency || "BRL");
    const frequency = String(body.frequency || "monthly");
    const nextOccurrence = body.nextOccurrence
      ? new Date(body.nextOccurrence)
      : new Date();
    const endDate = body.endDate ? new Date(body.endDate) : null;
    const category = body.category ? String(body.category) : "";
    const variable = !!body.variable;
    const estimationMethod = body.estimationMethod ? String(body.estimationMethod) : null;

    if (!name) return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    if (!["monthly", "yearly"].includes(frequency)) return NextResponse.json({ error: "Frequência inválida." }, { status: 400 });

    const doc = {
      name,
      amount,
      currency,
      frequency,
      nextOccurrence,
      endDate,
      category,
      variable,
      estimationMethod,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: session.user.id,
    };
    const ref = await adminDb.collection("recurringExpenses").add(doc);
    return NextResponse.json({ id: ref.id, ...doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
