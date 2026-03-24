import { NextResponse } from "next/server";
import { schedulingService } from "@/services/learning/schedulingService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/student/reschedule-availability?teacherId=XYZ123
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    !["student", "guarded_student", "teacher", "admin", "manager"].includes(
      session.user.role ?? "",
    )
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId");

  if (!teacherId) {
    return NextResponse.json(
      { error: "teacherId é obrigatório" },
      { status: 400 },
    );
  }

  try {
    const availabilityData =
      await schedulingService.getTeacherAvailabilityForReschedule(teacherId);
    return NextResponse.json(availabilityData);
  } catch (error: any) {
    console.error("[API] Error getting reschedule availability:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
