import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminStorage } from "@/lib/firebase/admin";
import { courseService } from "@/services/learning/courseService";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  const { courseId } = await params;
  try {
    const data = await courseService.getCourseWithContent(courseId);
    if (!data) return NextResponse.json({ error: "Curso não encontrado." }, { status: 404 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Falha ao carregar curso." }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  const { courseId } = await params;
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const title = form.get("title") as string | null;
      const language = form.get("language") as string | null;
      const description = form.get("description") as string | null;
      const duration = form.get("duration") as string | null;
      const role = form.get("role") as string | null;
      const file = form.get("image") as File | null;

      let imageUrl: string | undefined;
      if (file) {
        const fileName = `${courseId}/${Date.now()}_${file.name}`;
        const filePath = `course_images/${fileName}`;
        const arrayBuffer = await file.arrayBuffer();
        await adminStorage.bucket().file(filePath).save(Buffer.from(arrayBuffer), {
          contentType: file.type || "application/octet-stream",
          public: true,
        });
        const [url] = await adminStorage.bucket().file(filePath).getSignedUrl({
          action: "read",
          expires: Date.now() + 1000 * 60 * 60 * 24 * 365,
        });
        imageUrl = url;
      }

      const payload: any = {};
      if (title) payload.title = title;
      if (language) payload.language = language;
      if (description) payload.description = description;
      if (duration) payload.duration = duration;
      if (role) payload.role = role;
      if (imageUrl) payload.imageUrl = imageUrl;

      await courseService.updateCourseDetails(courseId, payload);
      return NextResponse.json({ ok: true });
    } else {
      const body = await request.json();
      await courseService.updateCourseDetails(courseId, body);
      return NextResponse.json({ ok: true });
    }
  } catch {
    return NextResponse.json({ error: "Falha ao atualizar curso." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  const { courseId } = await params;
  try {
    await courseService.deleteCourse(courseId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao excluir curso." }, { status: 500 });
  }
}
