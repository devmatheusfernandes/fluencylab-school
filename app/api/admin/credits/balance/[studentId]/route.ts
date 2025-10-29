// app/api/admin/credits/balance/[studentId]/route.ts

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

  // Check permissions
  const userPermissions = session.user.permissions || [];
  const { studentId } = await params;
  const canViewCredits = userPermissions.includes('credits.view.all') || 
                        userPermissions.includes('credits.view.assigned') ||
                        (userPermissions.includes('credits.view.self') && session.user.id === studentId);

  if (!canViewCredits) {
    return NextResponse.json({ error: 'Permissão insuficiente para visualizar créditos' }, { status: 403 });
  }

  try {
    
    if (!studentId) {
      return NextResponse.json({ error: 'ID do estudante é obrigatório' }, { status: 400 });
    }

    const balance = await creditService.getStudentCreditsBalance(studentId);
    
    return NextResponse.json({
      success: true,
      balance
    });
  } catch (error: any) {
    console.error('Erro ao buscar saldo de créditos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}