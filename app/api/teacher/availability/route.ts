import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SchedulingService } from '@/services/schedulingService';
import { AvailabilitySlot } from '@/types/time/availability';

const schedulingService = new SchedulingService();

// Handler para CRIAR um novo horário
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Allow both teachers and admins to access this endpoint
  if (!session?.user?.id || !session?.user?.role || !['teacher', 'admin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const availabilityData: AvailabilitySlot = {
      ...body,
      teacherId: session.user.id,
    };
    
    const newSlot = await schedulingService.addTeacherAvailability(availabilityData);
    return NextResponse.json(newSlot, { status: 201 });
  } catch (error: any) {
    console.error("Erro na API de disponibilidade (POST):", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// Handler para BUSCAR os horários
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // Allow both teachers and admins to access this endpoint
  if (!session?.user?.id || !session?.user?.role || !['teacher', 'admin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }
  
  try {
    const availabilityData = await schedulingService.getTeacherAvailability(session.user.id);
    return NextResponse.json(availabilityData);
  } catch (error: any) {
    console.error("Erro na API de disponibilidade (GET):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}