import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { TeacherService } from "@/services/teacher/teacherService";

const teacherService = new TeacherService();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.id ||
    !session?.user?.role ||
    !["teacher", "admin"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const populatedClasses = await teacherService.getPopulatedScheduledClasses(
      session.user.id
    );
    return NextResponse.json(populatedClasses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
