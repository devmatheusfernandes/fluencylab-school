import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createTeacherConfig } from '../../../lib/auth/middleware';
import { schedulingService } from '../../../services/schedulingService';

/**
 * Endpoint para listagem de aulas do professor
 * 
 * Aplicação do novo sistema de autorização:
 * - Validação automática de autenticação
 * - Verificação de role TEACHER, ADMIN ou MANAGER
 * - Validação de contexto (professor só vê suas próprias aulas)
 * - Rate limiting (100 requests/min)
 * - Logging automático de operações
 */
async function getTeacherClassesHandler(
  request: NextRequest,
  { params, authContext }: { params?: any; authContext: any }
) {
  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // O middleware já validou:
    // 1. Autenticação do usuário
    // 2. Role de professor/admin/manager
    // 3. Rate limiting
    
    const classes = await schedulingService.getTeacherClasses(
      authContext.userId,
      {
        status: status || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      }
    );

    return NextResponse.json({
      success: true,
      data: classes,
      total: classes.length
    });
    
  } catch (error) {
    console.error('Erro ao buscar aulas do professor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// Aplicar middleware de autorização com configuração específica para professores
export const GET = withAuth(
  getTeacherClassesHandler,
  createTeacherConfig('class', 'general')
);