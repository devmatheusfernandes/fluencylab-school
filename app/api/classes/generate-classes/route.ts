import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { schedulingService } from '@/services/schedulingService';

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin' && session?.user?.role !== 'manager') {
        return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    try {
        const { studentId } = await request.json();

        if (!studentId) {
            return NextResponse.json({ error: 'O ID do aluno é obrigatório.' }, { status: 400 });
        }

        await schedulingService.generateClassesFromTemplate(studentId);

        return NextResponse.json({ message: `Aulas para o aluno ${studentId} geradas com sucesso.` });
    } catch (error: any) {
        console.error("Erro ao gerar aulas:", error);
        return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
    }
}