import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createUniversalConfig } from '@/lib/auth/middleware';
import { schedulingService } from '@/services/schedulingService';

/**
 * Endpoint para reagendamento de aulas
 * 
 * Aplicação do novo sistema de autorização:
 * - Validação automática de autenticação
 * - Verificação de role (STUDENT, TEACHER, ADMIN, MANAGER)
 * - Validação de ownership/contexto baseada no role
 * - Rate limiting (10 reagendamentos/hora)
 * - Logging automático de operações
 */
async function rescheduleClassHandler(
    request: NextRequest,
    { params, authContext }: { params?: { classId: string }; authContext: any }
) {
    try {
        if (!params?.classId) {
            return NextResponse.json(
                { error: 'ID da aula é obrigatório.' },
                { status: 400 }
            );
        }
        const { classId } = params;
        const { newScheduledAt, reason, availabilitySlotId } = await request.json();

        // --- Validação dos dados de entrada ---
        if (!newScheduledAt) {
            return NextResponse.json({ error: 'A nova data de agendamento é obrigatória.' }, { status: 400 });
        }

        const newScheduledDate = new Date(newScheduledAt);
        if (isNaN(newScheduledDate.getTime())) {
            return NextResponse.json({ error: 'Formato de data inválido.' }, { status: 400 });
        }

        // Validate future date
        if (newScheduledDate <= new Date()) {
            return NextResponse.json(
                { error: 'A nova data deve ser no futuro.' },
                { status: 400 }
            );
        }

        // O middleware já validou:
        // 1. Autenticação do usuário
        // 2. Role apropriado
        // 3. Ownership/contexto da aula
        // 4. Rate limiting
        
        // --- Chamada ao Serviço ---
        const result = await schedulingService.rescheduleClass({
            classId,
            reschedulerId: authContext.userId,
            newScheduledAt: newScheduledDate,
            reason,
            availabilitySlotId,
        });

        return NextResponse.json({
            success: true,
            message: 'Aula reagendada com sucesso.',
            data: result
        });

    } catch (error: any) {
        console.error("Erro ao reagendar aula:", error);
        // Retorna a mensagem de erro específica do serviço para o frontend
        return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
    }
}

// Aplicar middleware de autorização com configuração universal (todos os roles)
export const POST = withAuth(
    rescheduleClassHandler,
    createUniversalConfig('class', 'reschedule')
);