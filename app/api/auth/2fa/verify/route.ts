import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { TwoFactorService } from '@/services/twoFactorService';
import { adminDb } from '@/lib/firebase/admin';

const twoFactorService = new TwoFactorService();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId, secret, token } = await request.json();
    
    // Verify that the user is trying to verify 2FA for themselves
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Verify the token
    const isValid = twoFactorService.verifyToken(secret, token);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 400 });
    }
    
    // Enable 2FA for the user
    await twoFactorService.enableTwoFactor(userId, secret);
    
    // Get backup codes
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const backupCodes = userData?.twoFactorBackupCodes || [];
    
    return NextResponse.json({ 
      success: true,
      backupCodes
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 });
  }
}