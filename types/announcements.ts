// types/announcements.ts

import { UserRoles } from "./users/userRoles";

export type AnnouncementType = 'info' | 'warning' | 'tip';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  createdAt: Date;
  createdBy: string; // admin user ID
  recipients: {
    type: 'role' | 'specific';
    roles?: UserRoles[];
    userIds?: string[];
  };
  readBy: string[]; // user IDs who have read the announcement
  isActive: boolean;
}