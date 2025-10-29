// app/api/announcements/route.ts
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { AnnouncementService } from '@/services/announcementService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserRoles } from '@/types/users/userRoles';

const announcementService = new AnnouncementService();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Type assertion to convert string role to UserRoles enum
    const userRole = session.user.role as UserRoles | undefined;
    
    // Check if userRole is valid
    if (!userRole || !Object.values(UserRoles).includes(userRole)) {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }

    const announcements = await announcementService.getAnnouncementsForUser(
      session.user.id,
      userRole
    );
    
    const unreadCount = await announcementService.getUnreadAnnouncementCount(
      session.user.id,
      userRole
    );

    return NextResponse.json({ announcements, unreadCount });
  } catch (error: any) {
    console.error('Error fetching user announcements:', error);
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