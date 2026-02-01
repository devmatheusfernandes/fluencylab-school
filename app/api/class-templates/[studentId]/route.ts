import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { classTemplateRepository } from "@/repositories";
import { ClassTemplate } from "@/types/classes/class";
import { authOptions } from "../../auth/[...nextauth]/route";
import { schedulingService } from "@/services/learning/schedulingService";

// GET: Retorna o template de horário de um aluno
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> } // <<< Updated type
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin" && session?.user?.role !== "manager") {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 403 }
    );
  }

  try {
    const { studentId } = await params; // <<< Await params
    const template = await classTemplateRepository.get(studentId);

    // ▼▼▼ LÓGICA MELHORADA ▼▼▼
    if (!template) {
      // Se não encontrar, retorna um template vazio com sucesso (200 OK)
      // Isso evita um erro no frontend para novos alunos.
      return NextResponse.json({ days: [] });
    }
    // ▲▲▲ FIM DA LÓGICA MELHORADA ▲▲▲

    return NextResponse.json(template);
  } catch (error) {
    console.error("Erro ao buscar template:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

// PUT: Atualiza o template de horário de um aluno
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> } // <<< Updated type
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin" && session?.user?.role !== "manager") {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 403 }
    );
  }

  try {
    const { studentId } = await params; // <<< Await params
    const templateData = (await request.json()) as ClassTemplate;

    // Validação básica do corpo da requisição
    if (!templateData || !Array.isArray(templateData.days)) {
      return NextResponse.json(
        { error: "Dados do template inválidos." },
        { status: 400 }
      );
    }

    await schedulingService.updateScheduleAndPruneClasses(
      studentId,
      templateData
    );

    // Futuramente, aqui podemos chamar o serviço para regenerar as aulas futuras
    // Por enquanto, apenas salvamos o template.

    return NextResponse.json({ message: "Template atualizado com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar template:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

// DELETE: Exclui o template de horário de um aluno e todas as suas aulas futuras.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> } // <<< Updated type
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin" && session?.user?.role !== "manager") {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 403 }
    );
  }

  try {
    const { studentId } = await params; // <<< Await params
    await schedulingService.deleteScheduleAndClasses(studentId);
    return NextResponse.json({
      message:
        "Template e todas as aulas futuras foram deletados com sucesso. O histórico não foi afetado.",
    });
  } catch (error: any) {
    console.error("Erro ao deletar template:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
