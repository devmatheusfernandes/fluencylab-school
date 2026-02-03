import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { courseService } from "@/services/learning/courseService";
import { announcementService } from "@/services/communication/announcementService";

export async function POST(
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
    const rawBlocks = Array.isArray(body.contentBlocks) ? body.contentBlocks : [];
    const contentBlocks = rawBlocks.map((block: any) => {
      if (block?.type === "text") {
        return {
          ...block,
          content:
            typeof block.content === "string" && block.content.trim() !== ""
              ? block.content
              : null,
        };
      }
      if (block?.type === "video") {
        return {
          ...block,
          url:
            typeof block.url === "string" && block.url.trim() !== ""
              ? block.url
              : null,
        };
      }
      return block;
    });
    const quiz = Array.isArray(body.quiz) ? body.quiz : [];
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];
    const order = typeof body.order === "number" ? body.order : 0;
    if (!title) return NextResponse.json({ error: "Título obrigatório." }, { status: 400 });
    const payload = {
      sectionId,
      title,
      contentBlocks,
      quiz,
      attachments,
      order,
    } as any;
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });
    const id = await courseService.saveLesson(courseId, sectionId, payload);

    // Notify enrolled students
    try {
      const enrolledStudents = await courseService.getEnrolledStudentIds(courseId);
      if (enrolledStudents.length > 0) {
        await announcementService.createSystemAnnouncement(
          "Nova Lição Disponível",
          `Uma nova lição "${title}" foi adicionada ao curso.`,
          enrolledStudents,
          `/hub/student/my-courses/course/lesson?courseId=${courseId}&lessonId=${id}`,
          true // skipPush
        );
      }
    } catch (notifyError) {
      console.error("Error sending notifications:", notifyError);
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Falha ao criar lição.", details: error?.message || String(error) }, { status: 500 });
  }
}
