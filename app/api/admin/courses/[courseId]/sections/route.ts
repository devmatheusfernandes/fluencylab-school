import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { courseService } from "@/services/learning/courseService";
import { announcementService } from "@/services/communication/announcementService";

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
    const title = String(body.title || "");
    const order = typeof body.order === "number" ? body.order : 0;
    if (!title) return NextResponse.json({ error: "Título obrigatório." }, { status: 400 });
    await courseService.saveSection(courseId, { title, order });

    // Notify enrolled students
    try {
      const enrolledStudents = await courseService.getEnrolledStudentIds(courseId);
      if (enrolledStudents.length > 0) {
        await announcementService.createSystemAnnouncement(
          "Novo Conteúdo Disponível",
          `Uma nova seção "${title}" foi adicionada ao curso.`,
          enrolledStudents,
          `/hub/student/my-courses/course?id=${courseId}`,
          true // skipPush
        );
      }
    } catch (notifyError) {
      console.error("Error sending notifications:", notifyError);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Falha ao criar seção." }, { status: 500 });
  }
}
