import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { schedulingService } from '@/services/schedulingService';
import { authOptions } from '../../auth/[...nextauth]/route';
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const studentId = session.user.id;
    const rescheduleStatus = await schedulingService.canReschedule(studentId);
    return NextResponse.json(rescheduleStatus);
  } catch (error: any) {
    console.error("Erro ao verificar status de reagendamento:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
