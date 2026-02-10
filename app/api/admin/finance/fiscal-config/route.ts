import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";
import { IrpfConfig, IrpfRange } from "@/types/financial/financial";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get("year");

    if (!yearStr || !/^\d{4}$/.test(yearStr)) {
      return NextResponse.json({ error: "Ano inválido." }, { status: 400 });
    }

    const docRef = adminDb.collection("irpf_tables").doc(yearStr);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return NextResponse.json(docSnap.data());
    } else {
      // Fallback defaults for 2024 if requesting 2024, or empty structure
      if (yearStr === "2024") {
        const default2024: IrpfConfig = {
          year: 2024,
          ranges: [
            { limit: 2711040, rate: 0, deduction: 0 },
            { limit: 3391980, rate: 0.075, deduction: 203328 },
            { limit: 4501260, rate: 0.15, deduction: 457728 },
            { limit: 5597616, rate: 0.225, deduction: 795468 },
            { limit: 999999999999, rate: 0.275, deduction: 1075308 },
          ]
        };
        return NextResponse.json(default2024);
      }
      return NextResponse.json(null);
    }
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
    const { year, ranges } = body;

    if (!year || typeof year !== "number") {
      return NextResponse.json({ error: "Ano inválido." }, { status: 400 });
    }
    if (!Array.isArray(ranges) || ranges.length === 0) {
      return NextResponse.json({ error: "Faixas inválidas." }, { status: 400 });
    }

    // Basic validation of ranges
    const validRanges = ranges.every((r: any) => 
      typeof r.limit === 'number' && 
      typeof r.rate === 'number' && 
      typeof r.deduction === 'number'
    );

    if (!validRanges) {
      return NextResponse.json({ error: "Formato de faixas inválido." }, { status: 400 });
    }

    const config: IrpfConfig = {
      year,
      ranges,
      updatedAt: new Date(),
      updatedBy: session.user.id
    };

    await adminDb.collection("irpf_tables").doc(String(year)).set(config);

    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno ao salvar configuração" }, { status: 500 });
  }
}
