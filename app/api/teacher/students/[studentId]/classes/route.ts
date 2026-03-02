import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { adminDb } from "@/lib/firebase/admin";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ClassStatus } from "@/types/classes/class";
import { FieldPath } from "firebase-admin/firestore";

interface Class {
  id: string;
  scheduledAt: Date;
  teacherId: string;
  teacherName: string;
  language: string;
  status: ClassStatus;
  feedback?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 401 },
    );
  }

  // Allow teachers, admins, and students to access this endpoint
  if (
    !session?.user?.role ||
    !["teacher", "admin", "student", "guarded_student"].includes(
      session.user.role,
    )
  ) {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 403 },
    );
  }

  try {
    const { studentId } = await params;

    // Permission checks based on user role
    if (
      session.user.role === "student" ||
      session.user.role === "guarded_student"
    ) {
      // Students can only access their own classes
      if (session.user.id !== studentId) {
        return NextResponse.json(
          { error: "Acesso não autorizado." },
          { status: 403 },
        );
      }
    } else if (session.user.role === "teacher") {
      // Teachers can only access classes of their students
      const teacherId = session.user.id;
      const studentDoc = await adminDb.doc(`users/${studentId}`).get();

      if (!studentDoc.exists) {
        return NextResponse.json(
          { error: "Aluno não encontrado." },
          { status: 404 },
        );
      }

      const studentData = studentDoc.data();
      const studentTeachers = studentData?.teachersIds || [];

      if (!studentTeachers.includes(teacherId)) {
        return NextResponse.json(
          { error: "Acesso não autorizado." },
          { status: 403 },
        );
      }
    }
    // Admins have access to all classes (no additional check needed)

    // Fetch classes from Firestore with a limit to prevent unbounded reads
    const classesSnapshot = await adminDb
      .collection("classes")
      .where("studentId", "==", studentId)
      .orderBy("scheduledAt", "desc")
      .limit(100) // Safety limit
      .get();

    // Get teacher names
    const teacherIds = [
      ...new Set(
        classesSnapshot.docs
          .map((doc) => doc.data().teacherId)
          .filter((id) => id),
      ),
    ];

    let teacherMap = new Map();
    if (teacherIds.length > 0) {
      // Handle potential large IN query by chunking (Firestore limit is 30 for IN queries)
      const chunkSize = 30;
      const chunks = [];
      for (let i = 0; i < teacherIds.length; i += chunkSize) {
        chunks.push(teacherIds.slice(i, i + chunkSize));
      }

      for (const chunk of chunks) {
        const teachers = await adminDb
          .collection("users")
          .where(FieldPath.documentId(), "in", chunk)
          .get();
        
        teachers.docs.forEach((doc) => {
          teacherMap.set(doc.id, doc.data().name);
        });
      }
    }

    const classes = classesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        scheduledAt: data.scheduledAt.toDate().toISOString(), // Convert to ISO string for proper serialization
        teacherId: data.teacherId,
        teacherName: data.teacherId
          ? teacherMap.get(data.teacherId) || "Professor não encontrado"
          : "Professor não atribuído",
        language: data.language || "Não especificado",
        status: data.status || ClassStatus.SCHEDULED,
        feedback: data.feedback || undefined,
        classType: data.classType,
        durationMinutes: data.durationMinutes,
        studentId: data.studentId,
        rescheduledFrom: data.rescheduledFrom,
        rescheduleReason: data.rescheduleReason,
        createdAt: data.createdAt?.toDate()?.toISOString(),
        updatedAt: data.updatedAt?.toDate()?.toISOString(),
        availabilitySlotId: data.availabilitySlotId,
        createdBy: data.createdBy,
      };
    });

    return NextResponse.json(classes);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 },
    );
  }
}
