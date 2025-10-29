import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SchedulingService } from "@/services/schedulingService";

const schedulingService = new SchedulingService();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { teacherId, slotId, scheduledAt, startTime, classTopic } =
      await request.json(); // 👈 Recebe aqui
    const result = await schedulingService.bookClass(
      session.user.id,
      teacherId,
      slotId,
      new Date(scheduledAt),
      startTime
    ); // 👈 Passa para o serviço
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
