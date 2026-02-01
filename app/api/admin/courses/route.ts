import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminStorage } from "@/lib/firebase/admin";
import { courseService } from "@/services/learning/courseService";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  try {
    const courses = await courseService.listCourses();
    return NextResponse.json(courses);
  } catch (error) {
    return NextResponse.json({ error: "Falha ao listar cursos." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  try {
    const form = await request.formData();
    const title = String(form.get("title") || "");
    const language = String(form.get("language") || "");
    const description = String(form.get("description") || "");
    const duration = String(form.get("duration") || "");
    const role = String(form.get("role") || "student");
    const file = form.get("image") as File | null;

    if (!title || !language || !description || !duration || !file) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const tempId = Date.now().toString();
    const fileName = `${tempId}_${file.name}`;
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

    const courseId = await courseService.createCourse({
      title,
      language,
      description,
      imageUrl: url,
      duration,
      role,
      sections: [],
      lessons: [],
      quizzes: [],
      createdAt: new Date() as any,
    } as any);

    return NextResponse.json({ id: courseId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Falha ao criar curso." }, { status: 500 });
  }
}
