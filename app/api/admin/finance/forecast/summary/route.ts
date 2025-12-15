import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";

function parseMonthStr(monthStr: string) {
  const [y, m] = monthStr.split("-").map((v) => parseInt(v, 10));
  return { year: y, monthIdx: m - 1 };
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function monthKey(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
}

function occursInMonth(item: any, year: number, monthIdx: number): boolean {
  const start = new Date(year, monthIdx, 1);
  const end = new Date(year, monthIdx + 1, 1);
  const next =
    item.nextOccurrence instanceof Date
      ? item.nextOccurrence
      : new Date(item.nextOccurrence);
  const endDate = item.endDate
    ? item.endDate instanceof Date
      ? item.endDate
      : new Date(item.endDate)
    : null;
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
    const fromStr = searchParams.get("from");
    const monthsParam = searchParams.get("months");
    if (!fromStr || !/^\d{4}-\d{2}$/.test(fromStr)) {
      return NextResponse.json({ error: "Parâmetro 'from' inválido." }, { status: 400 });
    }
    const months = Math.min(Math.max(parseInt(monthsParam || "6", 10), 1), 24);
    const { year, monthIdx } = parseMonthStr(fromStr);
    const startDate = new Date(year, monthIdx, 1);

    const subsSnap = await adminDb
      .collection("subscriptions")
      .where("status", "==", "active")
      .get();
    let monthlyIncomeTotal = 0;
    subsSnap.docs.forEach((doc) => {
      const d = doc.data() as any;
      monthlyIncomeTotal += Number(d.amount || 0);
    });

    const recSnap = await adminDb.collection("recurringExpenses").get();
    const recurringItems = recSnap.docs.map((doc) => {
      const d = doc.data() as any;
      return {
        id: doc.id,
        name: d.name,
        amount: Number(d.amount || 0),
        currency: d.currency || "BRL",
        frequency: d.frequency || "monthly",
        nextOccurrence:
          d.nextOccurrence?.toDate?.() ??
          (typeof d.nextOccurrence === "string" ? new Date(d.nextOccurrence) : d.nextOccurrence),
        endDate:
          (d.endDate?.toDate?.() ??
            (typeof d.endDate === "string" ? new Date(d.endDate) : d.endDate)) ?? null,
        category: d.category || "",
        variable: !!d.variable,
        estimationMethod: d.estimationMethod || null,
      };
    });

    const items: Array<{ month: string; income: number; expenses: number; net: number }> = [];
    for (let i = 0; i < months; i++) {
      const d = addMonths(startDate, i);
      const key = monthKey(d);
      const y = d.getFullYear();
      const mIdx = d.getMonth();
      let expTotal = 0;
      recurringItems.forEach((item) => {
        if (occursInMonth(item, y, mIdx)) {
          expTotal += item.amount;
        }
      });
      const incTotal = monthlyIncomeTotal;
      items.push({
        month: key,
        income: incTotal,
        expenses: expTotal,
        net: incTotal - expTotal,
      });
    }

    return NextResponse.json({ from: fromStr, months, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}

