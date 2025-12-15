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
    if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
      return NextResponse.json({ error: "Parâmetro 'month' inválido." }, { status: 400 });
    }

    const snap = await adminDb
      .collection("subscriptions")
      .where("status", "==", "active")
      .get();

    let total = 0;
    snap.docs.forEach((doc) => {
      const d = doc.data() as any;
      total += Number(d.amount || 0);
    });

    return NextResponse.json({ month: monthStr, total });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}

