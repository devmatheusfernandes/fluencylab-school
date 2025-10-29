// app/api/debug/email-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Firebase Auth user record
    const userRecord = await adminAuth.getUser(session.user.id);
    
    // Get Firestore user document
    const userDoc = await adminDb.collection('users').doc(session.user.id).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    return NextResponse.json({
      userId: session.user.id,
      sessionEmail: session.user.email,
      firebaseAuth: {
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        providerData: userRecord.providerData.map(p => ({
          providerId: p.providerId,
          email: p.email
        }))
      },
      firestoreData: {
        exists: userDoc.exists,
        emailVerified: userData?.emailVerified,
        email: userData?.email
      }
    });

  } catch (error) {
    console.error('Debug email status error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}