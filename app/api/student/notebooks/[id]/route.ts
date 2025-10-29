import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase/admin';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // For testing purposes, let's log the session
  console.log('Session in notebook detail API:', session);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const studentId = session.user.id;
    const { id } = await params;
  const notebookId = id;
    
    // Fetch specific notebook from Firestore
    const notebookRef = adminDb.doc(`users/${studentId}/Notebooks/${notebookId}`);
    const docSnap = await notebookRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Caderno não encontrado.' }, { status: 404 });
    }

    const data = docSnap.data();
    const notebook = {
      id: docSnap.id,
      title: data?.title || '',
      description: data?.description || '',
      createdAt: data?.createdAt ? data.createdAt.toDate() : null,
      studentName: data?.studentName || '',
      student: data?.student || '',
      content: data?.content || '',
    };

    return NextResponse.json(notebook);
  } catch (error: any) {
    console.error("Erro ao buscar o caderno do aluno:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}