import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";

function occursInMonth(item: any, year: number, monthIdx: number): boolean {
  const start = new Date(year, monthIdx, 1);
  const end = new Date(year, monthIdx + 1, 1);
  const next = item.nextOccurrence instanceof Date ? item.nextOccurrence : new Date(item.nextOccurrence);
  const endDate = item.endDate ? (item.endDate instanceof Date ? item.endDate : new Date(item.endDate)) : null;
  if (endDate && endDate < start) return false;
  if (item.frequency === "monthly") {
    return next <= end;
  }
  if (item.frequency === "yearly") {
    return next.getMonth() === monthIdx && next <= end;
  }
  return false;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get("month");
    if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
      return NextResponse.json({ error: "Parâmetro 'month' inválido." }, { status: 400 });
    }
    const [year, month] = monthStr.split("-").map((v) => parseInt(v, 10));

    const snap = await adminDb.collection("recurringExpenses").get();
    let total = 0;
    const items: any[] = [];
    snap.docs.forEach((doc) => {
      const d = doc.data() as any;
      const item = {
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
      };
      if (occursInMonth(item, year, month - 1)) {
        total += item.amount;
        items.push(item);
      }
    });

    return NextResponse.json({ month: monthStr, total, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
