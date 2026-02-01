import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { schedulingService } from "@/services/learning/schedulingService";
import { vacationRepository } from "@/repositories";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user;

  if (!sessionUser?.id) {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 401 }
    );
  }

  try {
    // ▼▼▼ CORREÇÃO AQUI ▼▼▼
    // Removemos 'teacherId' do corpo da requisição
    const { startDate, endDate, reason } = await request.json();

    // Pegamos o ID do professor diretamente da sessão segura
    const teacherId = sessionUser.id;

    // A verificação de 'teacherId' não é mais necessária, pois vem da sessão
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Os campos startDate e endDate são obrigatórios." },
        { status: 400 }
      );
    }

    // A verificação de permissão para criar férias para si mesmo já está implícita
    if (
      sessionUser.role !== "teacher" &&
      sessionUser.role !== "admin" &&
      sessionUser.role !== "manager"
    ) {
      return NextResponse.json(
        { error: "Apenas professores ou administradores podem criar férias." },
        { status: 403 }
      );
    }

    const newVacation = await schedulingService.createTeacherVacation({
      teacherId, // Usamos o ID da sessão
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
    });

    return NextResponse.json({
      message: "Período de férias criado e aulas atualizadas com sucesso.",
      data: newVacation,
    });
  } catch (error: any) {
    console.error("Erro ao criar período de férias:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

// GET: Lista todos os períodos de férias do professor logado
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 403 }
    );
  }

  try {
    const teacherId = session.user.id;
    const vacations = await vacationRepository.findAllByTeacherId(teacherId);
    return NextResponse.json(vacations);
  } catch (error: any) {
    console.error("Erro ao buscar férias:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

// DELETE: Cancela um período de férias do professor logado
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 403 }
    );
  }

  try {
    const url = new URL(request.url);
    const vacationId = url.searchParams.get("id");

    if (!vacationId) {
      return NextResponse.json(
        { error: "ID do período de férias é obrigatório." },
        { status: 400 }
      );
    }

    // Verificar se o período de férias pertence ao professor
    const vacation = await vacationRepository.findAllByTeacherId(
      session.user.id
    );
    const vacationExists = vacation.some((v) => v.id === vacationId);

    if (!vacationExists) {
      return NextResponse.json(
        {
          error:
            "Período de férias não encontrado ou não pertence ao professor.",
        },
        { status: 404 }
      );
    }

    // Verificar regras de cancelamento (40 dias de antecedência)
    const vacationData = vacation.find((v) => v.id === vacationId);
    if (vacationData) {
      const now = new Date();
      const earliestCancelDate = new Date(vacationData.startDate);
      earliestCancelDate.setDate(earliestCancelDate.getDate() - 40);

      if (now > earliestCancelDate) {
        return NextResponse.json(
          {
            error:
              "Período de férias não pode ser cancelado com menos de 40 dias de antecedência.",
          },
          { status: 400 }
        );
      }
    }

    await schedulingService.deleteTeacherVacation(vacationId, session.user.id);

    return NextResponse.json({
      message:
        "Período de férias cancelado com sucesso. As aulas afetadas foram reagendadas.",
    });
  } catch (error: any) {
    console.error("Erro ao cancelar período de férias:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
