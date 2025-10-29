// app/api/teacher/student-credits/[studentId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { CreditService } from '@/services/creditService';

const creditService = new CreditService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Check permissions - teachers can view credits of their students
  const userPermissions = session.user.permissions || [];
  if (!userPermissions.includes('credits.view.students')) {
    return NextResponse.json({ 
      error: 'Permissão insuficiente para visualizar créditos de estudantes' 
    }, { status: 403 });
  }

  try {
    const { studentId } = await params;
    
    if (!studentId) {
      return NextResponse.json({ error: 'ID do estudante é obrigatório' }, { status: 400 });
    }

    const balance = await creditService.getStudentCreditsBalance(studentId);
    
    return NextResponse.json({
      success: true,
      studentId,
      balance: {
        totalCredits: balance.totalCredits,
        bonusCredits: balance.bonusCredits,
        lateStudentCredits: balance.lateStudentCredits,
        hasCredits: balance.totalCredits > 0
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar créditos do estudante:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}