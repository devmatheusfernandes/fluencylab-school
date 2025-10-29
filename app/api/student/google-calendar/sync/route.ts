import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase/admin';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { google } from 'googleapis';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  updatedAt?: Date;
  dueDate?: Date; // Add dueDate field for Google Calendar integration
}

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
    
    // Get the student's Google Calendar tokens
    const userDoc = await adminDb.doc(`users/${studentId}`).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const googleCalendarTokens = userData?.googleCalendarTokens;
    
    if (!googleCalendarTokens || !googleCalendarTokens.accessToken) {
      return NextResponse.json({ error: 'Conexão com o Google Calendar não encontrada. Por favor, conecte sua conta do Google Calendar primeiro.' }, { status: 400 });
    }
    
    // Refresh tokens if needed
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/student/google-calendar/callback` : 'http://localhost:3000/api/student/google-calendar/callback'
    );
    
    oauth2Client.setCredentials({
      access_token: googleCalendarTokens.accessToken,
      refresh_token: googleCalendarTokens.refreshToken,
    });
    
    // Check if token needs refresh
    const currentTime = new Date().getTime();
    if (googleCalendarTokens.expiryDate && currentTime >= googleCalendarTokens.expiryDate) {
      const newTokens = await oauth2Client.refreshAccessToken();
      const tokens = newTokens.credentials;
      
      // Save refreshed tokens
      await adminDb.doc(`users/${studentId}`).update({
        'googleCalendarTokens.accessToken': tokens.access_token,
        'googleCalendarTokens.expiryDate': tokens.expiry_date,
      });
      
      oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
    }
    
    // Initialize Google Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Fetch tasks from Firestore
    const tasksSnapshot = await adminDb
      .collection('users')
      .doc(studentId)
      .collection('Tasks')
      .where('isDeleted', '!=', true)
      .orderBy('createdAt', 'desc')
      .get();

    const tasks = tasksSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text || '',
        completed: data.completed || false,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
        dueDate: data.dueDate ? data.dueDate.toDate() : undefined,
      };
    });

    // Get Google Calendar default times for each day of the week
    const googleCalendarDefaultTimes = userData?.googleCalendarDefaultTimes || {};
    
    // Create or update events in Google Calendar
    const results = [];
    for (const task of tasks) {
      try {
        // Skip completed tasks
        if (task.completed) {
          results.push({ taskId: task.id, status: 'skipped', reason: 'Task already completed' });
          continue;
        }
        
        // Determine the date for the event
        let eventDate = new Date();
        if (task.dueDate) {
          eventDate = task.dueDate; // Use the specific due date if set
        } else if (task.createdAt) {
          eventDate = task.createdAt; // Fallback to creation date
        }
        
        // Get default time for this day of the week
        const dayOfWeek = eventDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        const defaultTime = googleCalendarDefaultTimes[dayName];
        
        // Set default start and end times if available
        let startTime = '09:00';
        let endTime = '10:00';
        
        if (defaultTime) {
          startTime = defaultTime.startTime || '09:00';
          endTime = defaultTime.endTime || '10:00';
        }
        
        // Create date strings for the event
        const eventStartDate = new Date(eventDate);
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        eventStartDate.setHours(startHours, startMinutes, 0, 0);
        
        const eventEndDate = new Date(eventDate);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        eventEndDate.setHours(endHours, endMinutes, 0, 0);
        
        // Create event object
        const event = {
          summary: task.text,
          description: `Tarefa criada na plataforma Fluency Lab\nID: ${task.id}`,
          start: {
            dateTime: eventStartDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: eventEndDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 10 },
            ],
          },
        };
        
        // Try to find existing event for this task
        const existingEvents = await calendar.events.list({
          calendarId: 'primary',
          q: `Tarefa criada na plataforma Fluency Lab ID: ${task.id}`,
          timeMin: eventStartDate.toISOString(),
          timeMax: eventEndDate.toISOString(),
        });
        
        let eventId = null;
        if (existingEvents.data.items && existingEvents.data.items.length > 0) {
          eventId = existingEvents.data.items[0].id;
        }
        
        // Create or update event
        if (eventId) {
          // Update existing event
          await calendar.events.update({
            calendarId: 'primary',
            eventId: eventId,
            requestBody: event,
          });
          results.push({ taskId: task.id, status: 'updated', eventId });
        } else {
          // Create new event
          const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
          });
          results.push({ taskId: task.id, status: 'created', eventId: response.data.id });
        }
      } catch (error: any) {
        console.error(`Error processing task ${task.id}:`, error);
        results.push({ taskId: task.id, status: 'error', error: error.message });
      }
    }
    
    return NextResponse.json({ 
      message: 'Sincronização com o Google Calendar concluída com sucesso!',
      results 
    });
  } catch (error: any) {
    console.error('Error syncing with Google Calendar:', error);
    return NextResponse.json({ error: 'Failed to sync with Google Calendar: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}