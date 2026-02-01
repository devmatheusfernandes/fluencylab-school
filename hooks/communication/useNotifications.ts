"use client";

import { useState, useEffect, useCallback } from "react";
import { Notification } from "@/components/shared/NotificationCard/NotificationCard";
import { Announcement } from "@/types/communication/announcements";
import { useCurrentUser } from "../auth/useCurrentUser";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useCurrentUser();

  const fetchNotifications = useCallback(async () => {
    if (!user?.id || !user?.role) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/announcements", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("firebaseToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      const { announcements } = data;

      // Convert announcements to notifications
      const notificationList: Notification[] = announcements
        .map((announcement: Announcement) => ({
          id: announcement.id,
          title: announcement.title,
          message: announcement.message,
          type:
            announcement.type === "warning"
              ? "warning"
              : announcement.type === "tip"
                ? "info"
                : "info",
          timestamp: new Date(announcement.createdAt),
          read: announcement.readBy.includes(user.id),
        }))
        .filter((notification: Notification) => !notification.read);

      setNotifications(notificationList);
    } catch (err: any) {
      setError(err.message || "Failed to fetch notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/announcements/${id}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("firebaseToken")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification,
        ),
      );
    } catch (err: any) {
      setError(err.message || "Failed to mark notification as read");
      console.error("Error marking notification as read:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter((n) => !n.read);

      // Update local state first
      setNotifications((prev) =>
        prev.map((notification) =>
          !notification.read ? { ...notification, read: true } : notification,
        ),
      );

      // Send requests to mark as read (in parallel)
      await Promise.all(
        unreadNotifications.map((notification) =>
          fetch(`/api/announcements/${notification.id}/read`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("firebaseToken")}`,
              "Content-Type": "application/json",
            },
          }),
        ),
      );
    } catch (err: any) {
      setError(err.message || "Failed to mark all notifications as read");
      console.error("Error marking all notifications as read:", err);
    }
  }, [notifications]);

  const clearAll = useCallback(async () => {
    try {
      // Mark all unread notifications as read before clearing
      const unreadNotifications = notifications.filter((n) => !n.read);

      if (unreadNotifications.length > 0) {
        await Promise.all(
          unreadNotifications.map((notification) =>
            fetch(`/api/announcements/${notification.id}/read`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("firebaseToken")}`,
                "Content-Type": "application/json",
              },
            }),
          ),
        );
      }

      setNotifications([]);
    } catch (err: any) {
      setError(err.message || "Failed to clear notifications");
      console.error("Error clearing notifications:", err);
    }
  }, [notifications]);

  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        // For announcements, we don't actually delete them, but we can mark as read
        await markAsRead(id);
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== id),
        );
      } catch (err: any) {
        setError(err.message || "Failed to delete notification");
        console.error("Error deleting notification:", err);
      }
    },
    [markAsRead],
  );

  // Fetch notifications when user changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
    refreshNotifications: fetchNotifications,
  };
};
