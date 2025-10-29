import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase/admin';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string; notebookId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Allow both teachers and admins to access this endpoint
  if (!session?.user?.role || !['teacher', 'admin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const { studentId, notebookId } = await params;
    
    // Verify that this student belongs to the teacher (only for teachers)
    if (session.user.role === 'teacher') {
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
    }
    
    // Fetch specific notebook from Firestore
    const notebookDoc = await adminDb.doc(`users/${studentId}/Notebooks/${notebookId}`).get();
    
    if (!notebookDoc.exists) {
      return NextResponse.json({ error: 'Caderno não encontrado.' }, { status: 404 });
    }
    
    const notebookData = notebookDoc.data();
    
    // Verify the notebook belongs to the student
    if (notebookData?.student !== studentId) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    const data = notebookData;
    return NextResponse.json({
      id: notebookDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
    });
  } catch (error: any) {
    console.error('Error fetching notebook:', error);
    return NextResponse.json({ error: 'Failed to fetch notebook' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string; notebookId: string }> }
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
    const { studentId, notebookId } = await params;
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
    
    // Update notebook in Firestore
    const notebookRef = adminDb.doc(`users/${studentId}/Notebooks/${notebookId}`);
    const docSnap = await notebookRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Caderno não encontrado.' }, { status: 404 });
    }
    
    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    await notebookRef.update(updateData);
    
    const updatedNotebook = {
      id: notebookId,
      ...updateData,
    };

    return NextResponse.json(updatedNotebook);
  } catch (error: any) {
    console.error("Erro ao atualizar o caderno do aluno:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string; notebookId: string }> }
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
    const { studentId, notebookId } = await params;
    
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
    
    // Delete notebook from Firestore
    const notebookRef = adminDb.doc(`users/${studentId}/Notebooks/${notebookId}`);
    const docSnap = await notebookRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Caderno não encontrado.' }, { status: 404 });
    }

    await notebookRef.delete();

    return NextResponse.json({ message: 'Caderno excluído com sucesso.' });
  } catch (error: any) {
    console.error("Erro ao excluir o caderno do aluno:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}