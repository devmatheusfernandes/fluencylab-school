import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createStudentConfig } from '@/lib/auth/middleware';
import { schedulingService } from '@/services/schedulingService';

/**
 * Endpoint para cancelamento de aulas por estudantes
 * 
 * Aplicação do novo sistema de autorização:
 * - Validação automática de autenticação
 * - Verificação de role STUDENT
 * - Validação de ownership (estudante só pode cancelar suas próprias aulas)
 * - Rate limiting (5 cancelamentos/hora)
 * - Logging automático de operações
 */
async function cancelClassHandler(
  request: NextRequest,
  { params, authContext }: { params?: any; authContext: any }
) {
  try {
    const { classId, reason } = await request.json();

    if (!classId) {
      return NextResponse.json(
        { error: 'ID da aula é obrigatório.' },
        { status: 400 }
      );
    }

    // O middleware já validou:
    // 1. Autenticação do usuário
    // 2. Role de estudante
    // 3. Ownership da aula
    // 4. Rate limiting
    
    const result = await schedulingService.cancelClass(
      classId,
      'student',
      reason
    );

    return NextResponse.json({
      success: true,
      message: 'Aula cancelada com sucesso.',
      data: result
    });
    
  } catch (error) {
    console.error('Erro ao cancelar aula:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// Aplicar middleware de autorização com configuração específica para estudantes
export const POST = withAuth(
  cancelClassHandler,
  createStudentConfig('class', 'cancellation')
);