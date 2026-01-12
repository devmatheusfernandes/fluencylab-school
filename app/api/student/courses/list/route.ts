import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { courseRepository } from "@/repositories";
import { adminDb } from "@/lib/firebase/admin";
import { Course, Section, Lesson } from "@/types/quiz/types";

type StudentCourse = Course & {
  sectionCount: number;
  lessonCount: number;
  isEnrolled: boolean;
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  try {
    const role = session.user.role || "student";
    const studentId = session.user.id;

    const allCourses = await courseRepository.list();
    const filtered = allCourses.filter(
      (c) => c.role === "all" || c.role === role
    );

    const enriched: StudentCourse[] = [];
    for (const course of filtered) {
      const sections: Section[] = await courseRepository.getSectionsWithLessons(course.id);
      const sectionCount = sections.length;
      const lessonCount = sections.reduce(
        (sum, s) => sum + (s.lessons?.length || 0),
        0
      );

      const enrollSnap = await adminDb
        .doc(`users/${studentId}/enrollments/${course.id}`)
        .get();

      enriched.push({
        ...course,
        sectionCount,
        lessonCount,
        isEnrolled: enrollSnap.exists,
      } as StudentCourse);
    }

    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("Erro ao listar cursos do aluno:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

