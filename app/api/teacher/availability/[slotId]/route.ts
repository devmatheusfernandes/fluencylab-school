import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SchedulingService } from '@/services/schedulingService';

const schedulingService = new SchedulingService();

// Agora a função é POST, pois DELETE sem ID na URL é menos comum
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Todos os dados agora vêm do corpo da requisição
    const { slotId, deleteType, occurrenceDate } = await request.json();

    if (session?.user?.role !== 'teacher') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }
    
    // Validação de entrada
    if (!slotId || !deleteType || !occurrenceDate) {
      return NextResponse.json({ error: 'Dados insuficientes para a deleção.' }, { status: 400 });
    }

    await schedulingService.deleteTeacherAvailability(
      slotId,
      session.user.id,
      deleteType,
      new Date(occurrenceDate)
    );
    
    return NextResponse.json({ message: 'Disponibilidade deletada com sucesso.' });
  } catch (error: any) {
    console.error("Erro na API de deleção:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}