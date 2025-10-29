import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserAdminRepository } from '@/repositories/user.admin.repository';

const userAdminRepository = new UserAdminRepository();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and has proper permissions
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Only admins and managers can fetch all teachers
  if (!session.user.role || !['admin', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Permissão insuficiente.' }, { status: 403 });
  }

  try {
    const teachers = await userAdminRepository.findUsersByRole('teacher');
    
    // Return only necessary teacher information
    const teacherList = teachers.map(teacher => ({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.role
    }));
    
    return NextResponse.json(teacherList);
  } catch (error: any) {
    console.error("Erro ao buscar professores:", error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}