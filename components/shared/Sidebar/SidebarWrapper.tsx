"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { UserData } from "../UserCard/UserCard";
import { SidebarItemType } from "./Sidebar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFirebaseNotifications } from "@/hooks/useFirebaseNotifications";

interface SidebarWrapperProps {
  items: SidebarItemType[];
  user?: UserData;
}

export default function SidebarWrapper({ items, user }: SidebarWrapperProps) {
  const { user: currentUser } = useCurrentUser();
  const {
    notifications,
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useFirebaseNotifications();

  const userData = currentUser
    ? {
        name: currentUser.name,
        role: currentUser.role,
        avatar: currentUser.avatarUrl,
      }
    : user;

  return (
    <Sidebar
      items={items}
      user={userData}
      notifications={notifications}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      onDeleteNotification={deleteNotification}
      onClearAllNotifications={clearAll}
    />
  );
}
