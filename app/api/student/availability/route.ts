import { NextResponse, NextRequest } from 'next/server';
import { SchedulingService } from '@/services/schedulingService';
import { withAuth } from '@/lib/auth/middleware';

const schedulingService = new SchedulingService();

// Ex: GET /api/student/availability?teacherId=XYZ123
async function getAvailabilityHandler(request: NextRequest) {
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

export const GET = withAuth(getAvailabilityHandler, {
  authorization: {
    requiredRoles: ['student', 'admin', 'manager'],
  }
});