// services/announcementService.ts

import { AnnouncementRepository } from "@/repositories/communication/announcementRepository";
import { Announcement, AnnouncementType } from "@/types/communication/announcements";
import { UserRoles } from "@/types/users/userRoles";
import { pushService } from "@/services/communication/pushService";

const announcementRepository = new AnnouncementRepository();

export class AnnouncementService {
  async createAnnouncement(
    title: string,
    message: string,
    type: AnnouncementType,
    createdBy: string,
    recipientType: "role" | "specific",
    roles?: UserRoles[],
    userIds?: string[],
    link?: string,
    skipPush?: boolean
  ): Promise<Announcement> {
    const announcement = await announcementRepository.create({
      title,
      message,
      type,
      createdBy,
      recipients: {
        type: recipientType,
        roles: recipientType === "role" ? roles : undefined,
        userIds: recipientType === "specific" ? userIds : undefined,
      },
      link,
      isActive: true,
    });

    if (!skipPush) {
      try {
        await pushService.sendAnnouncement(announcement);
      } catch {}
    }

    return announcement;
  }

  async createSystemAnnouncement(
    title: string,
    message: string,
    recipients: string | string[],
    link?: string,
    skipPush?: boolean
  ): Promise<Announcement> {
    const userIds = Array.isArray(recipients) ? recipients : [recipients];
    return this.createAnnouncement(
      title,
      message,
      "info",
      "SYSTEM",
      "specific",
      undefined,
      userIds,
      link,
      skipPush
    );
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return await announcementRepository.findAll();
  }

  async getAnnouncementById(id: string): Promise<Announcement | null> {
    return await announcementRepository.findById(id);
  }

  async updateAnnouncement(
    id: string,
    data: Partial<Announcement>
  ): Promise<void> {
    await announcementRepository.update(id, data);
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await announcementRepository.delete(id);
  }

  async getAnnouncementsForUser(
    userId: string,
    userRole: UserRoles
  ): Promise<Announcement[]> {
    return await announcementRepository.getAnnouncementsForUser(
      userId,
      userRole
    );
  }

  async markAnnouncementAsRead(
    announcementId: string,
    userId: string
  ): Promise<void> {
    await announcementRepository.markAsRead(announcementId, userId);
  }

  async getUnreadAnnouncementCount(
    userId: string,
    userRole: UserRoles
  ): Promise<number> {
    return await announcementRepository.getUnreadCountForUser(userId, userRole);
  }
}

export const announcementService = new AnnouncementService();
