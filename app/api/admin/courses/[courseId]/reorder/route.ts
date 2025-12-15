import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { courseService } from "@/services/courseService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  const { courseId } = await params;
  try {
    const body = await request.json();
    const type = String(body.type || "");
    if (type !== "section" && type !== "lesson") {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }
    const a = body.a;
    const b = body.b;
    if (!a?.id || typeof a?.order !== "number" || !b?.id || typeof b?.order !== "number") {
      return NextResponse.json({ error: "Dados insuficientes." }, { status: 400 });
    }
    if (type === "section") {
      await courseService.swapSectionOrder(courseId, a, b);
    } else {
      const sectionId = String(body.sectionId || "");
      if (!sectionId) return NextResponse.json({ error: "sectionId obrigatório." }, { status: 400 });
      await courseService.swapLessonOrder(courseId, sectionId, a, b);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao reordenar." }, { status: 500 });
  }
}
