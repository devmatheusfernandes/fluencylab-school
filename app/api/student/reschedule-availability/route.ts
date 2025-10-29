import { NextResponse } from 'next/server';
import { schedulingService } from '@/services/schedulingService';

// GET /api/student/reschedule-availability?teacherId=XYZ123
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');

  if (!teacherId) {
    return NextResponse.json({ error: 'teacherId é obrigatório' }, { status: 400 });
  }

  try {
    console.log(`[API] Getting reschedule availability for teacher: ${teacherId}`);
    const availabilityData = await schedulingService.getTeacherAvailabilityForReschedule(teacherId);
    
    console.log(`[API] Reschedule availability response:`, {
      slotsCount: availabilityData.slots?.length || 0,
      exceptionsCount: availabilityData.exceptions?.length || 0,
      bookedClassesCount: availabilityData.bookedClasses?.length || 0,
      hasSettings: !!availabilityData.settings
    });
    
    return NextResponse.json(availabilityData);
  } catch (error: any) {
    console.error('[API] Error getting reschedule availability:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}