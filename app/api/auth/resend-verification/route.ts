// app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AuthService } from '@/services/authService';

const authService = new AuthService();

export async function POST(request: NextRequest) {
  try {
    console.log('[RESEND-VERIFICATION] Starting resend verification...');
    
    const session = await getServerSession(authOptions);
    console.log('[RESEND-VERIFICATION] Session:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userEmail: session?.user?.email 
    });
    
    if (!session?.user?.id || !session?.user?.email) {
      console.log('[RESEND-VERIFICATION] No session or user ID/email found');
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    console.log('[RESEND-VERIFICATION] Checking if email is already verified for user:', session.user.id);
    
    // Check if email is already verified
    const isVerified = await authService.isEmailVerified(session.user.id);
    console.log('[RESEND-VERIFICATION] Already verified:', isVerified);
    
    if (isVerified) {
      console.log('[RESEND-VERIFICATION] Email already verified, returning 400');
      return NextResponse.json({
        success: false,
        message: 'Email is already verified'
      }, { status: 400 });
    }

    console.log('[RESEND-VERIFICATION] Sending verification email...');
    
    // Send email verification using Firebase Auth
    const result = await authService.sendEmailVerification(session.user.id);
    
    console.log('[RESEND-VERIFICATION] Send email result:', result);
    
    if (result.success) {
      console.log('[RESEND-VERIFICATION] Verification email sent successfully');
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      console.log('[RESEND-VERIFICATION] Failed to send verification email:', result.message);
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[RESEND-VERIFICATION] Error resending verification email:', error);
    
    // Handle specific Firebase Auth errors
    if (error instanceof Error) {
      console.error('[RESEND-VERIFICATION] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      if (error.message.includes('user-not-found')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'User not found',
            message: 'User not found in Firebase Auth'
          },
          { status: 404 }
        );
      }
      
      if (error.message.includes('too-many-requests')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Too many requests. Please try again later.',
            message: 'Rate limit exceeded'
          },
          { status: 429 }
        );
      }
      
      // Return the actual error message for debugging
      return NextResponse.json(
        { 
          success: false,
          error: 'Internal server error',
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}