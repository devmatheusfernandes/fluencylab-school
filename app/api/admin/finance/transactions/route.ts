import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get("month");
    const yearStr = searchParams.get("year");
    const search = (searchParams.get("search") || "").toLowerCase().trim();

    let start: Date;
    let end: Date;

    if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
      const [year, month] = monthStr.split("-").map((v) => parseInt(v, 10));
      start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      end = new Date(year, month, 1, 0, 0, 0, 0);
    } else if (yearStr && /^\d{4}$/.test(yearStr)) {
      const year = parseInt(yearStr, 10);
      start = new Date(year, 0, 1, 0, 0, 0, 0);
      end = new Date(year + 1, 0, 1, 0, 0, 0, 0);
    } else {
      return NextResponse.json({ error: "Parâmetros inválidos. Informe 'month' (YYYY-MM) ou 'year' (YYYY)." }, { status: 400 });
    }

    const monthlyPaymentsSnap = await adminDb
      .collection("monthlyPayments")
      .where("paidAt", ">=", start)
      .where("paidAt", "<", end)
      .orderBy("paidAt", "desc")
      .get();

    const income = monthlyPaymentsSnap.docs
      .map((doc) => {
        const data = doc.data() as any;
        const paidAt =
          data.paidAt?.toDate?.() ??
          (typeof data.paidAt === "string" ? new Date(data.paidAt) : data.paidAt);
        const description = data.description || "Pagamento mensal";
        const method = data.paymentMethod || data.method || undefined;
        return {
          id: doc.id,
          type: "income" as const,
          amount: Number(data.amount || 0),
          currency: (data.currency as string) || "BRL",
          date: paidAt || new Date(data.createdAt),
          description,
          method,
          source: "monthlyPayment",
        };
      })
      .filter((t) =>
        search ? (t.description?.toLowerCase()?.includes(search) || t.method?.toLowerCase?.()?.includes(search)) : true
      );

    let otherTransactions: any[] = [];
    try {
      const financeSnap = await adminDb
        .collection("financeTransactions")
        .where("date", ">=", start)
        .where("date", "<", end)
        .orderBy("date", "desc")
        .get();

      otherTransactions = financeSnap.docs
        .map((doc) => {
          const data = doc.data() as any;
          const date =
            data.date?.toDate?.() ??
            (typeof data.date === "string" ? new Date(data.date) : data.date);
          return {
            id: doc.id,
            type: (data.type as "expense" | "income") || "expense",
            amount: Number(data.amount || 0),
            currency: (data.currency as string) || "BRL",
            date,
            description: (data.description as string) || "",
            method: (data.method as string) || undefined,
            source: "financeTransaction",
            category: data.category,
            deductible: data.deductible,
            fiscalTag: data.fiscalTag,
            attachmentUrl: data.attachmentUrl,
            attachmentFileName: data.attachmentFileName,
            attachmentContentType: data.attachmentContentType,
          };
        })
        .filter((t) =>
          search ? (t.description?.toLowerCase()?.includes(search) || (t.category || "").toLowerCase().includes(search)) : true
        );
    } catch {
      otherTransactions = [];
    }

    const combined = [...income, ...otherTransactions];
    const unique = new Map<string, any>();
    for (const t of combined) {
      const key = `${t.source || "tx"}:${t.id}`;
      if (!unique.has(key)) {
        unique.set(key, t);
      }
    }
    const transactions = Array.from(unique.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({ transactions });
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
    const type = String(body.type || "").toLowerCase();
    const amount = Math.round(Number(body.amount));
    const currency = String(body.currency || "BRL");
    const dateInput = body.date;
    const description = body.description ? String(body.description) : "";
    const method = body.method ? String(body.method) : undefined;
    const category = body.category ? String(body.category) : undefined;
    const deductible = typeof body.deductible === 'boolean' ? body.deductible : undefined;
    const fiscalTag = body.fiscalTag ? String(body.fiscalTag) : undefined;

    if (!["income", "expense"].includes(type)) {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    }
    let date: Date;
    if (typeof dateInput === "string") {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
      if (m) {
        date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
      } else {
        date = new Date(dateInput);
      }
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      date = new Date();
    }
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Data inválida." }, { status: 400 });
    }

    const doc: any = {
      type,
      amount,
      currency,
      date,
      description,
      createdBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (method !== undefined) doc.method = method;
    if (category !== undefined) doc.category = category;
    if (deductible !== undefined) doc.deductible = deductible;
    if (fiscalTag !== undefined) doc.fiscalTag = fiscalTag;

    const ref = await adminDb.collection("financeTransactions").add(doc);
    return NextResponse.json({ id: ref.id, ...doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno ao criar transação" }, { status: 500 });
  }
}
