import { NextResponse } from "next/server";
import { saveWaitlistEntry, waitlistSchema } from "@/lib/waitlist";

export const runtime = "nodejs";

// Limite simples por IP (best effort: em serverless a memória não é compartilhada entre instâncias).
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;

function tooManyRequests(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (tooManyRequests(ip)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente de novo em instantes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  // Campo-isca: pessoas não o veem, robôs preenchem. Respondemos "ok" sem gravar nada.
  if (body && typeof body === "object" && (body as Record<string, unknown>).website) {
    return NextResponse.json({ ok: true });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Dados inválidos.", field: first?.path[0] },
      { status: 422 },
    );
  }

  try {
    const result = await saveWaitlistEntry(parsed.data);
    return NextResponse.json({ ok: true, alreadyRegistered: !result.inserted });
  } catch (error) {
    console.error("[waitlist] falha ao salvar", error);
    return NextResponse.json(
      { error: "Não foi possível salvar agora. Tente novamente em alguns minutos." },
      { status: 503 },
    );
  }
}
