import { NextRequest, NextResponse } from "next/server";
import { TranscriptionService } from "@/services/learning/transcriptionService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";

async function canAccessStudent(studentId: string, session: any) {
  const role = session?.user?.role as string | undefined;
  const userId = session?.user?.id as string | undefined;
  if (!role || !userId) return false;

  if (["admin", "manager"].includes(role)) return true;
  if (["student", "guarded_student"].includes(role)) return userId === studentId;
  if (role !== "teacher") return false;

  const studentDoc = await adminDb.doc(`users/${studentId}`).get();
  if (!studentDoc.exists) return false;
  const studentData = studentDoc.data();
  const teachersIds = Array.isArray(studentData?.teachersIds)
    ? studentData.teachersIds
    : [];
  return teachersIds.includes(userId);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { callId, studentId, notebookId } = await req.json();

    if (!callId) {
      return NextResponse.json({ error: "Call ID is required" }, { status: 400 });
    }
    
    if (!studentId || !notebookId) {
      return NextResponse.json(
        { error: "Student ID and Notebook ID are required for saving." },
        { status: 400 },
      );
    }

    if (!(await canAccessStudent(String(studentId), session))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const service = new TranscriptionService();
    const { summary } = await service.processAndSaveSummary(callId, studentId, notebookId);

    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
