// hooks/useAnnouncements.ts
'use client';

import { useState, useEffect } from 'react';
import { Announcement, AnnouncementType } from '@/types/announcements';
import { useCurrentUser } from './useCurrentUser';
import { UserRoles } from '@/types/users/userRoles';

export function useAnnouncements() {
  const { user, isLoading } = useCurrentUser();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch announcements for the current user
  useEffect(() => {
    if (!user || isLoading) return;

    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/announcements');
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data.announcements);
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [user, isLoading]);

  const markAsRead = async (announcementId: string) => {
    try {
      const response = await fetch(`/api/announcements/${announcementId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        setAnnouncements(prev => 
          prev.map(announcement => 
            announcement.id === announcementId 
              ? { ...announcement, readBy: [...announcement.readBy, user!.id] } 
              : announcement
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const createAnnouncement = async (
    title: string,
    message: string,
    type: AnnouncementType,
    recipientType: 'role' | 'specific',
    roles?: UserRoles[],
    userIds?: string[]
  ) => {
    if (user?.role !== UserRoles.ADMIN) {
      throw new Error('Only admins can create announcements');
    }

    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Removed the Authorization header as NextAuth handles authentication via cookies
        },
        body: JSON.stringify({
          title,
          message,
          type,
          recipientType,
          roles,
          userIds
        })
      });

      if (response.ok) {
        const newAnnouncement = await response.json();
        setAnnouncements(prev => [newAnnouncement, ...prev]);
        return newAnnouncement;
      } else {
        throw new Error('Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  };

  return {
    announcements,
    unreadCount,
    loading,
    markAsRead,
    createAnnouncement
  };
}