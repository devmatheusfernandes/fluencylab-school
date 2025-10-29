// repositories/announcementRepository.ts

import { adminDb } from "@/lib/firebase/admin";
import { Announcement } from "@/types/announcements";
import { UserAdminRepository } from "./user.admin.repository";
import { UserRoles } from "@/types/users/userRoles";
import { Timestamp } from "firebase-admin/firestore";
import admin from "firebase-admin";

const announcementsCollection = adminDb.collection("announcements");

export class AnnouncementRepository {
  async create(
    announcement: Omit<Announcement, "id" | "createdAt" | "readBy">
  ): Promise<Announcement> {
    try {
      const newAnnouncement: Announcement = {
        ...announcement,
        id: announcementsCollection.doc().id,
        createdAt: new Date(),
        readBy: [],
      };

      // Clean up undefined values before saving to Firestore
      const cleanedAnnouncement = JSON.parse(
        JSON.stringify(newAnnouncement, (key, value) => {
          if (value === undefined) {
            return null; // Firestore doesn't support undefined values
          }
          return value;
        })
      );

      await announcementsCollection
        .doc(cleanedAnnouncement.id)
        .set(cleanedAnnouncement);
      return newAnnouncement;
    } catch (error) {
      console.error("Error creating announcement in repository:", error);
      throw error;
    }
  }

  async findAll(): Promise<Announcement[]> {
    try {
      const snapshot = await announcementsCollection
        .orderBy("createdAt", "desc")
        .get();
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : data.createdAt,
        } as Announcement;
      });
    } catch (error) {
      console.error("Error fetching all announcements in repository:", error);
      throw error;
    }
  }

  async findById(id: string): Promise<Announcement | null> {
    try {
      const doc = await announcementsCollection.doc(id).get();
      if (!doc.exists) return null;
      const data = doc.data()!;
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : data.createdAt,
      } as Announcement;
    } catch (error) {
      console.error(
        `Error fetching announcement by ID ${id} in repository:`,
        error
      );
      throw error;
    }
  }

  async update(id: string, data: Partial<Announcement>): Promise<void> {
    try {
      await announcementsCollection.doc(id).update(data);
    } catch (error) {
      console.error(`Error updating announcement ${id} in repository:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await announcementsCollection.doc(id).delete();
    } catch (error) {
      console.error(`Error deleting announcement ${id} in repository:`, error);
      throw error;
    }
  }

  async markAsRead(announcementId: string, userId: string): Promise<void> {
    try {
      const announcementRef = announcementsCollection.doc(announcementId);
      await announcementRef.update({
        readBy: admin.firestore.FieldValue.arrayUnion(userId),
      });
    } catch (error) {
      console.error(
        `Error marking announcement ${announcementId} as read for user ${userId} in repository:`,
        error
      );
      throw error;
    }
  }

  async getAnnouncementsForUser(
    userId: string,
    userRole: UserRoles
  ): Promise<Announcement[]> {
    try {
      const snapshot = await announcementsCollection
        .where("isActive", "==", true)
        .orderBy("createdAt", "desc")
        .get();

      const allAnnouncements = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : data.createdAt,
        } as Announcement;
      });

      // Filter announcements based on recipient type
      return allAnnouncements.filter((announcement) => {
        if (announcement.recipients.type === "specific") {
          return announcement.recipients.userIds?.includes(userId);
        } else if (announcement.recipients.type === "role") {
          return announcement.recipients.roles?.includes(userRole);
        }
        return false;
      });
    } catch (error: any) {
      console.error(
        `Error fetching announcements for user ${userId} with role ${userRole} in repository:`,
        error
      );
      // Provide guidance for the index error
      if (error.code === 9) {
        // FAILED_PRECONDITION
        console.error(
          "Firestore index required. Create the composite index using the link in the error message."
        );
      }
      throw error;
    }
  }

  async getUnreadCountForUser(
    userId: string,
    userRole: UserRoles
  ): Promise<number> {
    try {
      const announcements = await this.getAnnouncementsForUser(
        userId,
        userRole
      );
      return announcements.filter((a) => !a.readBy.includes(userId)).length;
    } catch (error) {
      console.error(
        `Error counting unread announcements for user ${userId} with role ${userRole} in repository:`,
        error
      );
      throw error;
    }
  }
}
