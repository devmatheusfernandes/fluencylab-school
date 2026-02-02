import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { adminAuth } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    // Include the role in the custom token claims so it can be used in security rules
    const additionalClaims = {
      role: session.user.role
    };

    const customToken = await adminAuth.createCustomToken(userId, additionalClaims);

    return NextResponse.json({ token: customToken });
  } catch (error) {
    console.error('Error creating custom token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
