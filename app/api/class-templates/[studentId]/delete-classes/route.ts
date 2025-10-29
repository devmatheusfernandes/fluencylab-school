import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { classRepository } from '@/repositories'; // Usando instância singleton
import { ClassTemplateDay, ClassStatus } from '@/types/classes/class'; // Added imports

// Usando instância singleton centralizada

// POST: Exclui aulas de um aluno com base em opções de data
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'manager') {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const { studentId } = await params;
    const { option, fromDate, toDate, templateEntries } = await request.json();

    // Validate input
    if (!option || !fromDate) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
    }

    if (option === 'date-range' && !toDate) {
      return NextResponse.json({ error: 'Data final é obrigatória para exclusão por período.' }, { status: 400 });
    }

    // Convert dates
    const fromDateObj = new Date(fromDate);
    const toDateObj = toDate ? new Date(toDate) : null;

    // Validate dates
    if (isNaN(fromDateObj.getTime())) {
      return NextResponse.json({ error: 'Data inicial inválida.' }, { status: 400 });
    }

    if (toDateObj && isNaN(toDateObj.getTime())) {
      return NextResponse.json({ error: 'Data final inválida.' }, { status: 400 });
    }

    // Delete classes based on option
    let deletedCount = 0;
    switch (option) {
      case 'from-date':
        if (templateEntries && templateEntries.length > 0) {
          // Delete specific template entries from date forward
          deletedCount = await classRepository.deleteFutureClassesByTemplateFromDate(studentId, templateEntries, fromDateObj);
        } else {
          // Delete all classes from date forward
          deletedCount = await classRepository.deleteFutureClassesFromDate(studentId, fromDateObj);
        }
        break;
      case 'date-range':
        if (!toDateObj) {
          return NextResponse.json({ error: 'Data final é obrigatória.' }, { status: 400 });
        }
        if (templateEntries && templateEntries.length > 0) {
          // Delete specific template entries in date range
          deletedCount = await classRepository.deleteFutureClassesByTemplateInRange(studentId, templateEntries, fromDateObj, toDateObj);
        } else {
          // Delete all classes in date range
          deletedCount = await classRepository.deleteFutureClassesInRange(studentId, fromDateObj, toDateObj);
        }
        break;
      default:
        return NextResponse.json({ error: 'Opção inválida.' }, { status: 400 });
    }

    return NextResponse.json({ 
      message: `Foram excluídas ${deletedCount} aulas com sucesso. O histórico não foi afetado.`,
      deletedCount
    });
  } catch (error: any) {
    console.error("Erro ao deletar aulas:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}