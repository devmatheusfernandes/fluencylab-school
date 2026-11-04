import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { listWaitlist } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

/** Evita "injeção de fórmula" ao abrir o CSV no Excel/Sheets. */
function cell(value: string | null | undefined): string {
  let text = value ?? "";
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!isAdmin(key)) return new NextResponse("Not found", { status: 404 });

  const rows = await listWaitlist();
  if (!rows) return new NextResponse("Banco não configurado", { status: 503 });

  const header = ["id", "criado_em", "nome", "email", "whatsapp", "idioma", "alunos", "como_cobra", "valor_que_pagaria", "maior_dor", "observacoes", "origem"];
  const lines = rows.map((r) =>
    [
      String(r.id),
      r.created_at,
      r.name,
      r.email,
      r.whatsapp,
      r.language,
      r.students_range,
      r.billing.join("|"),
      r.price_intent,
      r.main_pain,
      r.notes,
      r.source,
    ]
      .map(cell)
      .join(","),
  );

  return new NextResponse([header.join(","), ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="lista-de-espera.csv"',
      "Cache-Control": "no-store",
    },
  });
}
