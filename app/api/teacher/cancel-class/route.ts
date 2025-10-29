import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createTeacherConfig } from '../../../../lib/auth/middleware';
import { schedulingService } from '../../../../services/schedulingService';

/**
 * Endpoint para cancelamento de aulas por professores
 * 
 * Aplicação do novo sistema de autorização:
 * - Validação automática de autenticação
 * - Verificação de role TEACHER, ADMIN ou MANAGER
 * - Validação de contexto (professor só pode cancelar aulas que leciona)
 * - Rate limiting (10 cancelamentos/hora)
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
    // 2. Role de professor/admin/manager
    // 3. Contexto da aula (professor pode cancelar aulas que leciona)
    // 4. Rate limiting
    
    const result = await schedulingService.cancelClass(
      classId,
      'teacher',
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

// Aplicar middleware de autorização com configuração específica para professores
export const POST = withAuth(
  cancelClassHandler,
  createTeacherConfig('class', 'cancellation')
);