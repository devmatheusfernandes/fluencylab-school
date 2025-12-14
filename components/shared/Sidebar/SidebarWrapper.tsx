"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { UserData } from "../UserCard/UserCard";
import { SidebarItemType } from "./Sidebar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFirebaseNotifications } from "@/hooks/useFirebaseNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface SidebarWrapperProps {
  items: SidebarItemType[];
  user?: UserData;
}

export default function SidebarWrapper({ items, user }: SidebarWrapperProps) {
  const { user: currentUser } = useCurrentUser();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refreshNotifications,
  } = useFirebaseNotifications();
  const { isSupported, subscription, registerServiceWorker, subscribe } = usePushNotifications();

  React.useEffect(() => {
    registerServiceWorker();
  }, [registerServiceWorker]);

  React.useEffect(() => {
    if (!subscription && isSupported) {
      subscribe().catch(() => {});
    }
  }, [subscription, isSupported, subscribe]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.kind === 'announcement_push') {
        refreshNotifications();
      }
    };
    navigator.serviceWorker?.addEventListener('message', handler);
    return () => navigator.serviceWorker?.removeEventListener('message', handler);
  }, [refreshNotifications]);

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
