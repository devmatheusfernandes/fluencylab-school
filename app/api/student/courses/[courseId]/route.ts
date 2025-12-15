import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { courseRepository } from "@/repositories";
import { adminDb } from "@/lib/firebase/admin";
import { Course, Section } from "@/app/[locale]/hub/admin/courses/components/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  try {
    const { courseId } = await params;
    const studentId = session.user.id;

    const course: Course | null = await courseRepository.getById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Curso não encontrado." }, { status: 404 });
    }

    const sections: Section[] = await courseRepository.getSectionsWithLessons(courseId);
    const totalLessonsCount = sections.reduce(
      (sum, s) => sum + (s.lessons?.length || 0),
      0
    );

    const enrollmentSnap = await adminDb
      .doc(`users/${studentId}/enrollments/${courseId}`)
      .get();

    const enrollment = enrollmentSnap.exists
      ? (() => {
          const data = enrollmentSnap.data() || {};
          return {
            ...data,
            enrolledAt: data.enrolledAt instanceof Date ? data.enrolledAt.toISOString() : data.enrolledAt,
            lastAccessed: data.lastAccessed instanceof Date ? data.lastAccessed.toISOString() : data.lastAccessed,
          };
        })()
      : null;

    return NextResponse.json({
      course,
      sections,
      totalLessonsCount,
      enrollment,
    });
  } catch (error: any) {
    console.error("Erro ao obter detalhes do curso:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

