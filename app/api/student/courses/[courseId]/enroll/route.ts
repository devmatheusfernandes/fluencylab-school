import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";

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
    const studentId = session.user.id;

    const enrollRef = adminDb.doc(`users/${studentId}/enrollments/${courseId}`);
    const snap = await enrollRef.get();
    if (snap.exists) {
      return NextResponse.json({ success: true, alreadyEnrolled: true });
    }

    await enrollRef.set({
      courseId,
      userId: studentId,
      enrolledAt: new Date(),
      progress: {},
      completed: false,
      lastAccessed: new Date(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao matricular no curso:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

