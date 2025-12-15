import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  try {
    const { courseId, lessonId } = await params;
    const studentId = session.user.id;
    const docRef = adminDb.doc(
      `users/${studentId}/quizResults/${courseId}_${lessonId}`
    );
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json(null, { status: 200 });
    }
    const data = snap.data() || {};
    return NextResponse.json({
      ...data,
      submittedAt:
        data.submittedAt instanceof Date
          ? data.submittedAt.toISOString()
          : data.submittedAt,
    });
  } catch (error: any) {
    console.error("Erro ao obter resultados do quiz:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  if (session.user.role !== "student") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  try {
    const { courseId, lessonId } = await params;
    const { answers, score, totalQuestions, correct, lessonTitle } =
      await request.json();

    if (
      typeof score !== "number" ||
      typeof totalQuestions !== "number" ||
      !answers
    ) {
      return NextResponse.json(
        { error: "Dados do quiz inválidos." },
        { status: 400 }
      );
    }

    const percentage = Math.round((score / totalQuestions) * 100);
    const studentId = session.user.id;
    const docRef = adminDb.doc(
      `users/${studentId}/quizResults/${courseId}_${lessonId}`
    );
    await docRef.set(
      {
        userId: studentId,
        courseId,
        lessonId,
        answers,
        score,
        totalQuestions,
        percentage,
        correct: !!correct,
        submittedAt: new Date(),
        lessonTitle: lessonTitle || "",
      },
      { merge: true }
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao salvar resultados do quiz:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

