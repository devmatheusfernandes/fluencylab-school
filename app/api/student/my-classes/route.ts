import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createStudentConfig } from '../../../../lib/auth/middleware';
import { schedulingService } from '../../../../services/schedulingService';

/**
 * Endpoint para listagem de aulas do estudante
 * 
 * Aplicação do novo sistema de autorização:
 * - Validação automática de autenticação
 * - Verificação de role STUDENT
 * - Validação de ownership (estudante só vê suas próprias aulas)
 * - Rate limiting (100 requests/min)
 * - Logging automático de operações
 */
async function getStudentClassesHandler(
  request: NextRequest,
  { params, authContext }: { params?: any; authContext: any }
) {
  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // O middleware já validou:
    // 1. Autenticação do usuário
    // 2. Role de estudante
    // 3. Rate limiting
    
    const classes = await schedulingService.getPopulatedClassesForStudent(
      authContext.userId
    );

    return NextResponse.json({
      success: true,
      data: classes,
      total: classes.length,
      pagination: {
        limit: limit ? parseInt(limit) : null,
        offset: offset ? parseInt(offset) : null
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar aulas do estudante:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// Aplicar middleware de autorização com configuração específica para estudantes
export const GET = withAuth(
  getStudentClassesHandler,
  createStudentConfig('class', 'general')
);

