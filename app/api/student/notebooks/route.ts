import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase/admin';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // For testing purposes, let's log the session
  console.log('Session in notebooks API:', session);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const studentId = session.user.id;
    
    // Fetch notebooks from Firestore
    const notebookRef = adminDb.collection(`users/${studentId}/Notebooks`);
    const snapshot = await notebookRef.orderBy('createdAt', 'desc').get();
    
    const notebooks = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        studentName: data.studentName || '',
        student: data.student || '',
        content: data.content || '',
      };
    });

    return NextResponse.json(notebooks);
  } catch (error: any) {
    console.error("Erro ao buscar os cadernos do aluno:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}