import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase/admin';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string; taskId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Check if the current user is a teacher
  if (session.user.role !== 'teacher') {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const { studentId, taskId } = await params;
    const body = await request.json();
    
    // Verify that this student belongs to the teacher
    const teacherId = session.user.id;
    const studentDoc = await adminDb.doc(`users/${studentId}`).get();
    
    if (!studentDoc.exists) {
      return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });
    }
    
    const studentData = studentDoc.data();
    const studentTeachers = studentData?.teachersIds || [];
    
    if (!studentTeachers.includes(teacherId)) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }
    
    // Update task in Firestore
    const taskRef = adminDb.doc(`users/${studentId}/Tasks/${taskId}`);
    const docSnap = await taskRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Tarefa não encontrada.' }, { status: 404 });
    }
    
    // Handle dueDate if provided
    const updateData: any = {
      ...body,
      updatedAt: new Date(),
    };
    
    // Convert dueDate string to Date object if provided
    if (body.dueDate) {
      updateData.dueDate = new Date(body.dueDate);
    } else if (body.dueDate === null) {
      updateData.dueDate = null; // Explicitly set to null if cleared
    }

    await taskRef.update(updateData);
    
    const updatedTask = {
      id: taskId,
      ...updateData,
    };

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error("Erro ao atualizar a tarefa do aluno:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string; taskId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Check if the current user is a teacher
  if (session.user.role !== 'teacher') {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const { studentId, taskId } = await params;
    
    // Verify that this student belongs to the teacher
    const teacherId = session.user.id;
    const studentDoc = await adminDb.doc(`users/${studentId}`).get();
    
    if (!studentDoc.exists) {
      return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });
    }
    
    const studentData = studentDoc.data();
    const studentTeachers = studentData?.teachersIds || [];
    
    if (!studentTeachers.includes(teacherId)) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }
    
    // Soft delete task in Firestore (set isDeleted flag to true)
    const taskRef = adminDb.doc(`users/${studentId}/Tasks/${taskId}`);
    const docSnap = await taskRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Tarefa não encontrada.' }, { status: 404 });
    }
    
    await taskRef.update({
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: 'Tarefa marcada como deletada com sucesso.' });
  } catch (error: any) {
    console.error("Erro ao deletar a tarefa do aluno:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}




