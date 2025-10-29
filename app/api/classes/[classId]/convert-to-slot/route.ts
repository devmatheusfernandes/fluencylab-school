import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { schedulingService } from '@/services/schedulingService';
import { authOptions } from '../../../auth/[...nextauth]/route';

// Endpoint para converter aula cancelada/reagendada em slot disponível
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const { classId } = await params;
    
    // Verificar se o usuário é um professor
    if (session.user.role !== 'teacher') {
      return NextResponse.json({ 
        error: 'Apenas professores podem converter aulas em slots livres.' 
      }, { status: 403 });
    }

    // Converter a aula cancelada/reagendada em slot disponível
    const success = await schedulingService.convertCanceledClassToAvailableSlot(
      classId,
      session.user.id
    );

    if (success) {
      return NextResponse.json({ 
        message: 'Aula convertida em slot disponível com sucesso.',
        success: true
      });
    } else {
      return NextResponse.json({ 
        error: 'Falha ao converter aula em slot disponível.' 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro ao converter aula em slot disponível:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro interno do servidor.' 
    }, { status: 500 });
  }
}