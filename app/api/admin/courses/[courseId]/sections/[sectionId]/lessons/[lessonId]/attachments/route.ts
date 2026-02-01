import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminStorage } from "@/lib/firebase/admin";
import { courseService } from "@/services/learning/courseService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; sectionId: string; lessonId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  const { courseId, sectionId, lessonId } = await params;
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Arquivo obrigatório." }, { status: 400 });
    const attachmentId = `_${Math.random().toString(36).slice(2, 11)}`;
    const filePath = `course_attachments/${courseId}/${sectionId}/${lessonId}/${attachmentId}_${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    await adminStorage.bucket().file(filePath).save(Buffer.from(arrayBuffer), {
      contentType: file.type || "application/octet-stream",
      public: true,
    });
    const bucketName = adminStorage.bucket().name;
    const url = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(filePath)}`;
    const attachment = {
      id: attachmentId,
      name: file.name,
      url,
      type: file.type,
      size: file.size,
    };
    await courseService.addLessonAttachment(courseId, sectionId, lessonId, attachment);
    return NextResponse.json(attachment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Falha ao enviar anexo." }, { status: 500 });
  }
}

export async function DELETE(
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
    const attachment = body?.attachment;
    if (!attachment?.id || !attachment?.url) {
      return NextResponse.json({ error: "Dados do anexo inválidos." }, { status: 400 });
    }
    const url = new URL(attachment.url);
    const parts = url.pathname.split("/");
    const decodedPath = decodeURIComponent(parts.slice(2).join("/"));
    if (decodedPath) {
      await adminStorage.bucket().file(decodedPath).delete({ ignoreNotFound: true });
    }
    await courseService.removeLessonAttachment(courseId, sectionId, lessonId, attachment);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao remover anexo." }, { status: 500 });
  }
}
