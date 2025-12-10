import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role || !['teacher', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const body = await request.json();
    const studentId: string | undefined = body?.studentId;

    if (!studentId || typeof studentId !== 'string' || !studentId.trim()) {
      return NextResponse.json({ error: 'studentId inválido.' }, { status: 400 });
    }

    const studentRef = adminDb.collection('users').doc(studentId);
    const studentDoc = await studentRef.get();
    if (!studentDoc.exists) {
      return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });
    }

    // Validar relação professor-aluno (admins podem ignorar)
    if (session.user.role === 'teacher') {
      const data = studentDoc.data() || {} as any;
      const teachersIds: string[] = Array.isArray(data.teachersIds) ? data.teachersIds : [];
      if (!teachersIds.includes(session.user.id)) {
        return NextResponse.json({ error: 'Professor não associado ao aluno.' }, { status: 403 });
      }
    }

    await studentRef.update({ callId: null });

    return NextResponse.json({ studentId, callId: null });
  } catch (error) {
    console.error('Erro ao encerrar chamada:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
