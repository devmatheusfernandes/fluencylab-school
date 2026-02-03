import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { courseService } from "@/services/learning/courseService";
import { announcementService } from "@/services/communication/announcementService";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; sectionId: string; lessonId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  const { courseId, sectionId, lessonId } = await params;
  try {
    const body = await request.json();
    await courseService.saveLesson(courseId, sectionId, { id: lessonId, ...body });

    // Notify enrolled students
    try {
      const enrolledStudents = await courseService.getEnrolledStudentIds(courseId);
      if (enrolledStudents.length > 0) {
        const lessonTitle = body.title || "Conteúdo";
        await announcementService.createSystemAnnouncement(
          "Lição Atualizada",
          `A lição "${lessonTitle}" sofreu alterações recentes.`,
          enrolledStudents,
          `/hub/student/my-courses/course/lesson?courseId=${courseId}&lessonId=${lessonId}`,
          true // skipPush
        );
      }
    } catch (notifyError) {
      console.error("Error sending notifications:", notifyError);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao atualizar lição." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string; sectionId: string; lessonId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  const { courseId, sectionId, lessonId } = await params;
  try {
    await courseService.deleteLesson(courseId, sectionId, lessonId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao excluir lição." }, { status: 500 });
  }
}
