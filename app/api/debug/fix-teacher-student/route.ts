import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserService } from '@/services/userService';

const userService = new UserService();

export async function POST(request: Request) {
  // Temporarily allow access without authentication for debugging
  // const session = await getServerSession(authOptions);
  
  // Only allow admins to use this debug endpoint
  // if (!session?.user || !session.user.role || session.user.role !== 'admin') {
  //   return NextResponse.json({ error: 'Acesso não autorizado. Apenas admins podem usar este endpoint.' }, { status: 403 });
  // }

  try {
    const { teacherId, studentId } = await request.json();
    
    if (!teacherId || !studentId) {
      return NextResponse.json({ error: 'teacherId e studentId são obrigatórios.' }, { status: 400 });
    }

    // Add the teacher to the student's teachersIds array
    await userService.manageStudentTeachers(studentId, [teacherId]);
    
    return NextResponse.json({ 
      message: 'Relacionamento professor-aluno corrigido com sucesso.',
      teacherId,
      studentId
    });
  } catch (error: any) {
    console.error('Error fixing teacher-student relationship:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint to check current teacher-student relationships
export async function GET(request: Request) {
  // Temporarily allow access without authentication for debugging
  // const session = await getServerSession(authOptions);
  
  // Only allow admins to use this debug endpoint
  // if (!session?.user || !session.user.role || session.user.role !== 'admin') {
  //   return NextResponse.json({ error: 'Acesso não autorizado. Apenas admins podem usar este endpoint.' }, { status: 403 });
  // }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  
  if (!studentId) {
    return NextResponse.json({ error: 'studentId é obrigatório.' }, { status: 400 });
  }

  try {
    const { adminDb } = await import('@/lib/firebase/admin');
    const studentDoc = await adminDb.doc(`users/${studentId}`).get();
    
    if (!studentDoc.exists) {
      return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });
    }
    
    const studentData = studentDoc.data();
    const teachersIds = studentData?.teachersIds || [];
    
    return NextResponse.json({
      studentId,
      teachersIds,
      hasTeachers: teachersIds.length > 0
    });
  } catch (error: any) {
    console.error('Error checking teacher-student relationship:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}