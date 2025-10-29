import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { schedulingService } from '@/services/schedulingService';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Check if the current user is a student
  if (session.user.role !== 'student') {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const { classId, newScheduledAt, availabilitySlotId, reason } = await request.json();
    
    if (!classId) {
      return NextResponse.json({ error: 'ID da aula não fornecido.' }, { status: 400 });
    }

    if (!newScheduledAt) {
      return NextResponse.json({ error: 'Nova data não fornecida.' }, { status: 400 });
    }

    const studentId = session.user.id;
    
    // Reschedule the class
    const result = await schedulingService.rescheduleClass({
      classId,
      reschedulerId: studentId,
      newScheduledAt: new Date(newScheduledAt),
      availabilitySlotId,
      reason: reason || 'Reagendamento solicitado pelo aluno'
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error rescheduling class:', error);
    return NextResponse.json({ error: error.message || 'Failed to reschedule class' }, { status: 500 });
  }
}