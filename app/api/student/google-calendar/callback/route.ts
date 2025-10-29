import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase/admin';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // This should be the user ID
  
  if (!code) {
    return NextResponse.redirect(new URL('/hub/plataforma/settings', request.url));
  }
  
  // Verify session
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Check if the current user is a student
  if (session.user.role !== 'student') {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }
  
  // Verify that the state matches the current user ID
  if (state !== session.user.id) {
    return NextResponse.json({ error: 'Invalid state parameter.' }, { status: 400 });
  }

  try {
    // Configure OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/student/google-calendar/callback` : 'http://localhost:3000/api/student/google-calendar/callback'
    );
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Save tokens to Firestore
    await adminDb.doc(`users/${session.user.id}`).update({
      googleCalendarTokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        tokenType: tokens.token_type,
        scope: tokens.scope,
      },
    });
    
    // Redirect back to settings page with success message
    const redirectUrl = new URL('/hub/plataforma/settings', request.url);
    redirectUrl.searchParams.set('googleCalendarConnected', 'true');
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Error exchanging Google Calendar code for tokens:', error);
    
    // Redirect back to settings page with error message
    const redirectUrl = new URL('/hub/plataforma/settings', request.url);
    redirectUrl.searchParams.set('googleCalendarError', 'Failed to connect to Google Calendar: ' + (error.message || 'Unknown error'));
    return NextResponse.redirect(redirectUrl);
  }
}