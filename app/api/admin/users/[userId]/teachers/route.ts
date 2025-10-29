// app/api/admin/users/[userId]/teachers/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserService } from '@/services/userService';

const userService = new UserService();

// Usamos PUT para substituir completamente a lista de professores
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  // Apenas Admins e Managers podem realizar esta ação
  if (!session?.user || !session.user.role || !['admin', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const { userId } = await params;
    const { teacherIds } = await request.json();
    await userService.manageStudentTeachers(userId, teacherIds);
    return NextResponse.json({ message: 'Professores do aluno atualizados com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
