// app/api/announcements/[id]/read/route.ts
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { AnnouncementService } from '@/services/announcementService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const announcementService = new AnnouncementService();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    await announcementService.markAnnouncementAsRead(id, session.user.id);

    return NextResponse.json({ message: 'Announcement marked as read' });
  } catch (error: any) {
    console.error('Error marking announcement as read:', error);
    // More detailed error logging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}