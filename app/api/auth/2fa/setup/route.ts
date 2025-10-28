import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from '@/lib/firebase/admin';
import { TwoFactorService } from '@/services/twoFactorService';

const twoFactorService = new TwoFactorService();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId } = await request.json();
    
    // Verify that the user is trying to setup 2FA for themselves
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Generate a secret for 2FA
    const secret = twoFactorService.generateSecret();
    
    // Get user email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const email = userData?.email;
    
    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 });
    }
    
    // Generate QR code URL
    const qrCodeUrl = twoFactorService.generateQRCodeURL(email, secret);
    
    return NextResponse.json({ 
      secret,
      qrCodeUrl
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 });
  }
}