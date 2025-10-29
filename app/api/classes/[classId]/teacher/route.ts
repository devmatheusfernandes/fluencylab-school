import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase/admin';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ClassRepository } from '@/repositories/classRepository';
import { UserAdminRepository } from '@/repositories/user.admin.repository';

const classRepository = new ClassRepository();
const userAdminRepository = new UserAdminRepository();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> } // <<< Updated type
) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and has proper permissions
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Only admins and managers can update class teachers
  if (!session.user.role || !['admin', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Permissão insuficiente.' }, { status: 403 });
  }

  try {
    const { classId } = await params; // <<< Await params
    const { teacherId } = await request.json();

    // Validate input - teacherId can be null/empty to remove teacher
    if (teacherId === undefined) {
      return NextResponse.json({ error: 'ID do professor é obrigatório.' }, { status: 400 });
    }

    // Get the class to update
    const classDoc = await classRepository.findClassById(classId);
    if (!classDoc) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 });
    }

    // Get the student to update their teachersIds array
    const student = await userAdminRepository.findUserById(classDoc.studentId);
    if (!student) {
      return NextResponse.json({ error: 'Estudante não encontrado.' }, { status: 404 });
    }

    let newTeacher = null;
    // If teacherId is provided, verify the teacher exists and is a teacher
    if (teacherId) {
      newTeacher = await userAdminRepository.findUserById(teacherId);
      if (!newTeacher || newTeacher.role !== 'teacher') {
        return NextResponse.json({ error: 'Professor não encontrado ou não é um professor válido.' }, { status: 400 });
      }
    }

    // Update the class with the new teacher (or remove teacher if teacherId is null/empty)
    await classRepository.update(classId, { teacherId: teacherId || null });

    // Update the student's teachersIds array
    // Only add the new teacher to the student's teachersIds array if not already present
    const currentTeacherIds = student.teachersIds || [];
    
    // Add new teacher to student's teachersIds array if it's not already there and teacherId is provided
    if (teacherId && !currentTeacherIds.includes(teacherId)) {
      const updatedTeacherIds = [...currentTeacherIds, teacherId];
      await userAdminRepository.update(classDoc.studentId, { teachersIds: updatedTeacherIds });
    }

    return NextResponse.json({ 
      message: 'Professor da aula atualizado com sucesso.',
      classId,
      teacherId
    });
  } catch (error: any) {
    console.error("Erro ao atualizar professor da aula:", error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}