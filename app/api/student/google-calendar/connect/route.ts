import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check if the current user is a student
  if (session.user.role !== 'student') {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  try {
    // Configure OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/student/google-calendar/callback` : 'http://localhost:3000/api/student/google-calendar/callback'
    );

    // Generate the authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      prompt: 'consent', // Force re-consent to get refresh token
      state: session.user.id, // Pass user ID as state
    });

    // Redirect to Google's OAuth 2.0 server
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Error generating Google Calendar auth URL:', error);
    return NextResponse.json({ error: 'Failed to connect to Google Calendar: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}