import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase/admin';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Check if the current user is a student
  if (session.user.role !== 'student') {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    const studentId = session.user.id;
    
    // Remove Google Calendar tokens from user document
    await adminDb.doc(`users/${studentId}`).update({
      googleCalendarTokens: FieldValue.delete(),
    });
    
    return NextResponse.json({ 
      message: 'Google Calendar desconectado com sucesso!' 
    });
  } catch (error: any) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json({ 
      error: 'Failed to disconnect Google Calendar: ' + (error.message || 'Unknown error') 
    }, { status: 500 });
  }
}