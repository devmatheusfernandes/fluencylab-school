import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  // Allow both teachers and admins to access this endpoint
  if (!session?.user?.id || !session?.user?.role || !['teacher', 'admin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  try {
    const settings = await request.json();
    const userRef = adminDb.collection('users').doc(session.user.id);
    await userRef.update({ schedulingSettings: settings });
    return NextResponse.json({ message: 'Configurações salvas.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}