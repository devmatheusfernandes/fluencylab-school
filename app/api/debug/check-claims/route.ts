import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { adminAuth } from '@/lib/firebase/admin';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const userRecord = await adminAuth.getUser(session.user.id);
    const claims = userRecord.customClaims;
    
    return NextResponse.json({ 
      message: "Claims do usuário atual",
      userId: session.user.id,
      claims: claims 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}