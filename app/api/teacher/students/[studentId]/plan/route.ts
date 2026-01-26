
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { planRepository } from "@/repositories/planRepository";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ studentId: string }> }
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = params;
    const teacherId = session.user.id;
    const userRole = session.user.role;

    // Check permissions
    if (userRole === "teacher") {
      // Check if teacher has access to this student
      const studentDoc = await adminDb.collection("users").doc(studentId).get();
      
      if (!studentDoc.exists) {
        return NextResponse.json(
          { error: "Aluno não encontrado." },
          { status: 404 }
        );
      }

      const studentData = studentDoc.data();
      const studentTeachers = studentData?.teachersIds || [];

      if (!studentTeachers.includes(teacherId)) {
        return NextResponse.json(
          { error: "Acesso não autorizado." },
          { status: 403 }
        );
      }
    } else if (userRole !== "admin" && userRole !== "manager") {
       // Students can access their own plan, handled in student API routes usually, 
       // but this is under /api/teacher/... so maybe restrict to staff?
       // The prompt context is teacher panel.
       // Let's stick to teacher/admin/manager checks.
       return NextResponse.json(
        { error: "Acesso não autorizado." },
        { status: 403 }
      );
    }

    const plan = await planRepository.findActivePlanByStudent(studentId);
    
    // It's okay if plan is null, we return null.
    return NextResponse.json(plan);

  } catch (error: any) {
    console.error("Error fetching student plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
