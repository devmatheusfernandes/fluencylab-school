import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createTeacherConfig } from '../../../../lib/auth/middleware';
import { schedulingService } from '../../../../services/schedulingService';

/**
 * Endpoint para atualização de status de aulas
 * 
 * Aplicação do novo sistema de autorização:
 * - Validação automática de autenticação
 * - Verificação de role TEACHER, ADMIN ou MANAGER
 * - Validação de contexto (professor só pode atualizar aulas que leciona)
 * - Rate limiting (100 requests/min)
 * - Logging automático de operações
 */
async function updateClassStatusHandler(
  request: NextRequest,
  { params, authContext }: { params?: { classId: string }; authContext: any }
) {
  try {
    console.log('=== DEBUG updateClassStatusHandler ===' );
    console.log('params:', params);
    
    const resolvedParams = await params;
    console.log('resolvedParams:', resolvedParams);
    
    if (!resolvedParams?.classId) {
      console.log('ERROR: classId não encontrado');
      return NextResponse.json(
        { error: 'ID da aula é obrigatório.' },
        { status: 400 }
      );
    }
    const { classId } = resolvedParams;
    console.log('classId extraído:', classId);
    
    const requestBody = await request.json();
    console.log('requestBody:', requestBody);
    
    const { status, feedback } = requestBody;

    // Validar se pelo menos um campo foi fornecido
    if (!status && !feedback) {
      return NextResponse.json(
        { error: 'Status ou feedback é obrigatório.' },
        { status: 400 }
      );
    }

    // Validate status values if provided
    if (status) {
      const validStatuses = ['scheduled', 'completed', 'cancelled', 'no_show'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Status inválido.' },
          { status: 400 }
        );
      }
    }

    // O middleware já validou:
    // 1. Autenticação do usuário
    // 2. Role de professor/admin/manager
    // 3. Contexto da aula (professor pode atualizar aulas que leciona)
    // 4. Rate limiting
    
    const result = await schedulingService.updateClassStatus(
      classId,
      status || undefined,
      feedback,
      authContext.userId
    );

    return NextResponse.json({
      success: true,
      message: 'Status da aula atualizado com sucesso.',
      data: result
    });
    
  } catch (error) {
    console.error('Erro ao atualizar status da aula:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// Aplicar middleware de autorização com configuração específica para professores
export const PATCH = withAuth(
  updateClassStatusHandler,
  createTeacherConfig('class', 'general')
);