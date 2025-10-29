// app/api/auth/verify-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AuthService } from '@/services/authService';

const authService = new AuthService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Check if email is verified
    const isVerified = await authService.isEmailVerified(session.user.id);
    
    return NextResponse.json({
      success: true,
      emailVerified: isVerified,
      email: session.user.email
    });

  } catch (error) {
    console.error('Error checking email verification status:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}