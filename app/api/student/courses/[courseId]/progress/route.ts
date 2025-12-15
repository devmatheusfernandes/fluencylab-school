import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";
import { courseRepository } from "@/repositories";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  if (session.user.role !== "student") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  try {
    const { courseId } = await params;
    const { lessonId } = await request.json();
    if (!lessonId) {
      return NextResponse.json({ error: "lessonId é obrigatório." }, { status: 400 });
    }

    const studentId = session.user.id;
    const enrollRef = adminDb.doc(`users/${studentId}/enrollments/${courseId}`);
    const snap = await enrollRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Não está matriculado neste curso." }, { status: 403 });
    }

    const data = snap.data() || {};
    const progress = { ...(data.progress || {}) };
    progress[lessonId] = true;

    const sections = await courseRepository.getSectionsWithLessons(courseId);
    const totalLessons = sections.reduce(
      (sum, s) => sum + (s.lessons?.length || 0),
      0
    );
    const completedCount = Object.values(progress).filter(Boolean).length;
    const courseCompleted = completedCount >= totalLessons;

    await enrollRef.update({
      progress,
      lastAccessed: new Date(),
      completed: courseCompleted,
    });

    return NextResponse.json({ success: true, courseCompleted });
  } catch (error: any) {
    console.error("Erro ao atualizar progresso:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

