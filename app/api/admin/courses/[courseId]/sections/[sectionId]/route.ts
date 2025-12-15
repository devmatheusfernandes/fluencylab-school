import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { courseService } from "@/services/courseService";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; sectionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  const { courseId, sectionId } = await params;
  try {
    const body = await request.json();
    const title = String(body.title || "");
    if (!title) return NextResponse.json({ error: "Título obrigatório." }, { status: 400 });
    await courseService.saveSection(courseId, { id: sectionId, title });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao atualizar seção." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string; sectionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  const { courseId, sectionId } = await params;
  try {
    await courseService.deleteSectionWithContent(courseId, sectionId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao excluir seção." }, { status: 500 });
  }
}
