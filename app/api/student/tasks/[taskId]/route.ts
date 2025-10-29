import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase/admin';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Check if the current user is a student
  if (session.user.role !== 'student') {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const { taskId } = await params;
    const body = await request.json();
    
    const studentId = session.user.id;
    
    // Update task in Firestore
    const taskRef = adminDb.doc(`users/${studentId}/Tasks/${taskId}`);
    const docSnap = await taskRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Tarefa não encontrada.' }, { status: 404 });
    }
    
    // Only allow updating completed status and dueDate for students
    const allowedUpdates: any = {
      updatedAt: new Date(),
    };
    
    // Allow students to update completion status
    if (body.completed !== undefined) {
      allowedUpdates.completed = body.completed;
    }
    
    // Allow students to update dueDate (if needed)
    if (body.dueDate !== undefined) {
      allowedUpdates.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    await taskRef.update(allowedUpdates);
    
    // Get the updated task data
    const updatedDoc = await taskRef.get();
    const updatedData = updatedDoc.data();
    
    const updatedTask = {
      id: taskId,
      text: updatedData?.text || '',
      completed: updatedData?.completed || false,
      createdAt: updatedData?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
      updatedAt: updatedData?.updatedAt?.toDate()?.toISOString() || undefined,
      dueDate: updatedData?.dueDate?.toDate()?.toISOString() || undefined, // Add dueDate
    };

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error("Erro ao atualizar a tarefa:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}