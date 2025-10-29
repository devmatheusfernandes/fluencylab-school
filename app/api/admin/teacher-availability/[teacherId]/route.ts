import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SchedulingService } from '@/services/schedulingService';
import { AvailabilityType } from '@/types/time/availability';

const schedulingService = new SchedulingService();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and has proper permissions
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Only admins and managers can fetch teacher availability
  if (!session.user.role || !['admin', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Permissão insuficiente.' }, { status: 403 });
  }

  try {
    const { teacherId } = await params;
    const availabilityData = await schedulingService.getTeacherAvailability(teacherId);
    
    // Filter only REGULAR availability slots
    const regularSlots = availabilityData.slots.filter(
      slot => slot.type === AvailabilityType.REGULAR
    );

    // Group slots by day and time to show unique combinations
    const uniqueSlots = regularSlots.reduce((acc, slot) => {
      const dayOfWeek = new Date(slot.startDate).getDay();
      const key = `${dayOfWeek}-${slot.startTime}-${slot.endTime}`;
      
      if (!acc[key]) {
        acc[key] = {
          id: slot.id,
          day: getDayName(dayOfWeek),
          startTime: slot.startTime,
          endTime: slot.endTime,
          title: slot.title,
          originalSlot: slot
        };
      }
      
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      slots: Object.values(uniqueSlots),
      exceptions: availabilityData.exceptions,
      bookedClasses: availabilityData.bookedClasses
    });
  } catch (error: any) {
    console.error("Erro ao buscar disponibilidade do professor:", error);
    return NextResponse.json({ 
      error: error.message || 'Erro interno do servidor.' 
    }, { status: 500 });
  }
}

function getDayName(dayOfWeek: number): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[dayOfWeek];
}