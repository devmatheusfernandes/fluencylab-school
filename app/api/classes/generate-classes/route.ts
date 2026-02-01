import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { schedulingService } from '@/services/learning/schedulingService';

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin' && session?.user?.role !== 'manager') {
        return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { studentId, action, strategy, substituteTeacherId } = body;

        if (!studentId) {
            return NextResponse.json({ error: 'O ID do aluno é obrigatório.' }, { status: 400 });
        }

        // Action: Check for conflicts only
        if (action === 'check') {
            const conflicts = await schedulingService.checkTemplateConflicts(studentId);
            return NextResponse.json({ conflicts });
        }

        // Action: Generate (default)
        const result = await schedulingService.generateClassesFromTemplate(
            studentId, 
            strategy, // 'default' | 'skip_and_extend' | 'substitute'
            substituteTeacherId
        );

        if (!result.success) {
            return NextResponse.json({ 
                error: 'Foram detectados conflitos de férias com o professor titular.',
                conflicts: result.conflicts,
                requiresAction: true
            }, { status: 409 });
        }

        return NextResponse.json({ 
            message: `Aulas para o aluno ${studentId} geradas com sucesso.`,
            details: {
                skippedCount: result.skippedCount,
                strategyUsed: strategy || 'default'
            }
        });
    } catch (error: any) {
        console.error("Erro ao gerar aulas:", error);
        return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
    }
}
