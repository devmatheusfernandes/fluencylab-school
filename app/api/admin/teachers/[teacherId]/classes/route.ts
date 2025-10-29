import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserAdminRepository } from '@/repositories/user.admin.repository';
import { ClassRepository } from '@/repositories/classRepository';

const classRepository = new ClassRepository();
const userAdminRepository = new UserAdminRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // Only admins can access this endpoint
  if (!session?.user?.id || !session?.user?.role || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const { teacherId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Verify teacher exists
    const teacher = await userAdminRepository.findUserById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json({ error: 'Professor não encontrado.' }, { status: 404 });
    }

    // Get all classes for this teacher
    let classes = await classRepository.findAllClassesByTeacherId(teacherId);

    // Apply filters if provided
    if (status) {
      classes = classes.filter(cls => cls.status === status);
    }

    if (startDate) {
      const start = new Date(startDate);
      classes = classes.filter(cls => {
        const classDate = cls.scheduledAt instanceof Date ? cls.scheduledAt : new Date(cls.scheduledAt);
        return classDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      classes = classes.filter(cls => {
        const classDate = cls.scheduledAt instanceof Date ? cls.scheduledAt : new Date(cls.scheduledAt);
        return classDate <= end;
      });
    }

    // Get student information for each class
    const studentIds = [...new Set(classes.map(cls => cls.studentId))];
    const students = await Promise.all(
      studentIds.map(id => userAdminRepository.findUserById(id))
    );
    const studentMap = new Map(students.filter(s => s).map(s => [s!.id, s!.name]));

    // Format response with student names
    const formattedClasses = classes.map(cls => ({
      id: cls.id,
      studentId: cls.studentId,
      studentName: studentMap.get(cls.studentId) || 'Aluno não encontrado',
      scheduledAt: cls.scheduledAt instanceof Date ? cls.scheduledAt.toISOString() : cls.scheduledAt,
      status: cls.status,
      language: cls.language,
      classType: cls.classType,
      completedAt: cls.completedAt ? (cls.completedAt instanceof Date ? cls.completedAt.toISOString() : cls.completedAt) : null,
      createdAt: cls.createdAt instanceof Date ? cls.createdAt.toISOString() : cls.createdAt,
      durationMinutes: cls.durationMinutes
    }));

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email
      },
      classes: formattedClasses,
      total: formattedClasses.length
    });

  } catch (error: any) {
    console.error('Error fetching teacher classes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}