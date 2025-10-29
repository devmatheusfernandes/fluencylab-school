import { NextResponse } from 'next/server';
import { SchedulingService } from '@/services/schedulingService';

const schedulingService = new SchedulingService();

// Ex: GET /api/student/availability?teacherId=XYZ123
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');

  if (!teacherId) {
    return NextResponse.json({ error: 'teacherId é obrigatório' }, { status: 400 });
  }

  try {
    const availabilityData = await schedulingService.getTeacherAvailabilityForStudent(teacherId);
    return NextResponse.json(availabilityData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}