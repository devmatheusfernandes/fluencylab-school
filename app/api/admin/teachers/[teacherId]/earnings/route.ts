import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserAdminRepository } from "@/repositories/user.admin.repository";
import { ClassRepository } from "@/repositories/classRepository";
import { ClassStatus } from "@/types/classes/class";

const classRepository = new ClassRepository();
const userAdminRepository = new UserAdminRepository();

const RATE_PER_CLASS_CENTS = 2500;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.role || !["admin", "manager"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  try {
    const { teacherId } = await params;
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const teacher = await userAdminRepository.findUserById(teacherId);
    if (!teacher || teacher.role !== "teacher") {
      return NextResponse.json({ error: "Professor não encontrado." }, { status: 404 });
    }

    let classes = await classRepository.findAllClassesByTeacherId(teacherId);

    if (startDateParam) {
      const start = new Date(startDateParam);
      classes = classes.filter((cls) => {
        const date = cls.scheduledAt instanceof Date ? cls.scheduledAt : new Date(cls.scheduledAt);
        return date >= start;
      });
    }

    if (endDateParam) {
      const end = new Date(endDateParam);
      classes = classes.filter((cls) => {
        const date = cls.scheduledAt instanceof Date ? cls.scheduledAt : new Date(cls.scheduledAt);
        return date <= end;
      });
    }

    const studentIds = [...new Set(classes.map((c) => c.studentId))];
    const students = await Promise.all(studentIds.map((id) => userAdminRepository.findUserById(id)));
    const studentMap = new Map(students.filter(Boolean).map((s) => [s!.id, s!.name]));

    const statsMap = new Map<string, { studentName: string; completedClasses: number; earningsCents: number }>();

    classes.forEach((cls) => {
      if (cls.status !== ClassStatus.COMPLETED || !cls.completedAt) return;
      const studentId = cls.studentId;
      const current = statsMap.get(studentId) || {
        studentName: studentMap.get(studentId) || `Aluno ${studentId}`,
        completedClasses: 0,
        earningsCents: 0,
      };
      current.completedClasses += 1;
      current.earningsCents = current.completedClasses * RATE_PER_CLASS_CENTS;
      statsMap.set(studentId, current);
    });

    const stats = Array.from(statsMap.entries()).map(([studentId, data]) => ({
      studentId,
      ...data,
    }));

    const totalClasses = stats.reduce((sum, s) => sum + s.completedClasses, 0);
    const totalEarningsCents = stats.reduce((sum, s) => sum + s.earningsCents, 0);

    return NextResponse.json({
      teacher: { id: teacher.id, name: teacher.name, email: teacher.email },
      ratePerClassCents: RATE_PER_CLASS_CENTS,
      stats,
      total: { classes: totalClasses, earningsCents: totalEarningsCents },
    });
  } catch (error: any) {
    console.error("Error computing teacher earnings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
