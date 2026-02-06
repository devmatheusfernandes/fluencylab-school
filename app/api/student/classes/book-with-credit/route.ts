import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { schedulingService } from "@/services/learning/schedulingService";
import { RegularCreditType } from "@/types/credits/regularClassCredits";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "student") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      teacherId,
      scheduledAt,
      availabilitySlotId,
      creditType,
      classTopic,
    } = body;

    if (!teacherId || !scheduledAt || !availabilitySlotId || !creditType) {
      return NextResponse.json(
        { error: "Dados incompletos para agendamento." },
        { status: 400 },
      );
    }

    // Validate Credit Type
    if (
      creditType !== RegularCreditType.BONUS &&
      creditType !== RegularCreditType.LATE_STUDENTS
    ) {
      return NextResponse.json(
        { error: "Tipo de crédito inválido." },
        { status: 400 },
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: "Data inválida." }, { status: 400 });
    }

    const result = await schedulingService.bookClassWithCredit(
      session.user.id,
      teacherId,
      scheduledDate,
      availabilitySlotId,
      creditType,
      classTopic,
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error booking class with credit:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao agendar aula." },
      { status: 500 },
    );
  }
}
