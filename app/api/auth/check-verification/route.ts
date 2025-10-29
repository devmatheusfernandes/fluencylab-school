// app/api/auth/check-verification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AuthService } from '@/services/authService';

const authService = new AuthService();

export async function GET(request: NextRequest) {
  try {
    console.log('[CHECK-VERIFICATION] Starting verification check...');
    
    const session = await getServerSession(authOptions);
    console.log('[CHECK-VERIFICATION] Session:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userEmail: session?.user?.email 
    });
    
    if (!session?.user?.id) {
      console.log('[CHECK-VERIFICATION] No session or user ID found');
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    console.log('[CHECK-VERIFICATION] Checking email verification for user:', session.user.id);
    
    // Check if email is verified using AuthService
    const isVerified = await authService.isEmailVerified(session.user.id);
    
    console.log('[CHECK-VERIFICATION] Verification result:', isVerified);
    
    return NextResponse.json({
      success: true,
      verified: isVerified,
      emailVerified: isVerified, // For compatibility with different components
      email: session.user.email
    });

  } catch (error) {
    console.error('[CHECK-VERIFICATION] Error checking email verification status:', error);
    
    if (error instanceof Error) {
      console.error('[CHECK-VERIFICATION] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Failed to check verification status',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}