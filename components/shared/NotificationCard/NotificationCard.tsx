"use client";

import * as React from "react";
import { twMerge } from "tailwind-merge";
import { useState } from "react";
import { CheckCircle, Bell, MailWarning, ClosedCaption, X } from "lucide-react";

// --- Type Definitions ---
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date | string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// --- Notification Item Component ---
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  isCollapsed?: boolean;
  isOpen: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  isCollapsed = false,
  isOpen,
}) => {
  const getTypeIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <MailWarning className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <MailWarning className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (date: Date | string) => {
    // Convert string to Date if needed
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Validate that we have a valid date
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - dateObj.getTime()) / (1000 * 60)
      );
      return `${diffInMinutes}m`;
    }
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  if (isCollapsed) {
    return (
      <div
        className={twMerge(
          "flex items-center justify-center w-10 h-10 rounded-lg border transition-colors cursor-pointer",
          notification.read
            ? "bg-surface border-surface-2 hover:bg-surface-hover"
            : "bg-primary/10 border-primary/20 hover:bg-primary/15"
        )}
        onClick={() => onMarkAsRead(notification.id)}
        title={notification.title}
      >
        {getTypeIcon()}
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        "group relative p-3 rounded-lg border transition-colors",
        notification.read
          ? "bg-surface border-surface-2 hover:bg-surface-hover"
          : "bg-primary/5 border-primary/10 hover:bg-primary/10"
      )}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
      )}

      {/* Close button */}
      <button
        onClick={() => onDelete(notification.id)}
        className="absolute top-2 right-6 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-surface-2 rounded"
      >
        <X className="w-3 h-3 text-paragraph" />
      </button>

      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getTypeIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className={twMerge(
                "text-sm font-medium truncate",
                notification.read ? "text-paragraph" : "text-title"
              )}
            >
              {notification.title}
            </h4>
            <span className="text-xs text-paragraph/60 whitespace-nowrap">
              {formatTime(notification.timestamp)}
            </span>
          </div>

          <p className="text-xs text-paragraph/80 leading-relaxed mb-2">
            {notification.message}
          </p>
          {isOpen && (
            <div className="flex items-center gap-2">
              {!notification.read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  Marcar como lida
                </button>
              )}

              {notification.action && (
                <button
                  onClick={notification.action.onClick}
                  className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Notification Badge Component ---
interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  className,
}) => {
  if (count === 0) return null;

  return (
    <div
      className={twMerge(
        "absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium border-2 border-container",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </div>
  );
};

// --- Modal Component ---
interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasNotifications = notifications.length > 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 bg-container rounded-t-2xl border-t border-surface-2 z-50 max-h-[80vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-surface-2 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-paragraph" />
            <h3 className="text-lg font-semibold text-title">
              Todas as Notificações
            </h3>
            {unreadCount > 0 && (
              <NotificationBadge
                count={unreadCount}
                className="relative top-0 right-0"
              />
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5 text-paragraph" />
          </button>
        </div>

        {/* Actions */}
        {hasNotifications && (
          <div className="flex items-center justify-end gap-1 px-4 py-2 border-b border-surface-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
              >
                Marcar todas
              </button>
            )}
            <span className="text-paragraph/40 text-xs">|</span>
            <button
              onClick={onClearAll}
              className="text-xs text-paragraph/60 hover:text-paragraph transition-colors"
            >
              Limpar
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {hasNotifications ? (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                  isOpen={isOpen}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="w-8 h-8 text-paragraph/30 mb-2" />
                <p className="text-sm text-paragraph/60">Nenhuma notificação</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// --- Main Notification Card Component ---
interface NotificationCardProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  isCollapsed?: boolean;
  isMobile?: boolean;
  className?: string;
  isOpen: boolean;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  isCollapsed = false,
  isMobile = false,
  className,
  isOpen,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasNotifications = notifications.length > 0;

  // When collapsed, show only the Bell icon with badge
  if (isCollapsed) {
    return (
      <div className={twMerge("w-full flex justify-center", className)}>
        <button
          onClick={() => setIsModalOpen(true)}
          className="relative p-2 rounded-lg hover:bg-primary/30 hover:text-primary transition-colors"
        >
          <Bell className="w-5 h-5 text-paragraph" />
          {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
        </button>

        <NotificationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          notifications={notifications}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
          onDelete={onDelete}
          onClearAll={onClearAll}
        />
      </div>
    );
  }

  // On mobile, show all notifications
  if (isMobile) {
    return (
      <div className={twMerge("w-full", className)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <h3 className="text-sm font-medium">Notificações</h3>
            {unreadCount > 0 && (
              <NotificationBadge
                count={unreadCount}
                className="relative top-0 right-0"
              />
            )}
          </div>

          {hasNotifications && (
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  Marcar todas
                </button>
              )}
              <span className="text-paragraph/40 text-xs">|</span>
              <button
                onClick={onClearAll}
                className="text-xs text-paragraph/60 hover:text-paragraph transition-colors"
              >
                Limpar
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {hasNotifications ? (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                isOpen={false}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="w-8 h-8 text-paragraph/30 mb-2" />
              <p className="text-sm text-paragraph/60">Nenhuma notificação</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // On desktop, show maximum 2 notifications with "View all" button
  const displayNotifications = notifications.slice(0, 2);
  const hasMoreNotifications = notifications.length > 2;

  return (
    <div className={twMerge("w-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium">Notificações</h3>
          {unreadCount > 0 && (
            <NotificationBadge
              count={unreadCount}
              className="relative top-0 right-0"
            />
          )}
        </div>

        {hasNotifications && isOpen && (
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
              >
                Marcar todas
              </button>
            )}
            <span className="text-paragraph/40 text-xs">|</span>
            <button
              onClick={onClearAll}
              className="text-xs text-paragraph/60 hover:text-paragraph transition-colors"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {hasNotifications ? (
          <>
            {displayNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                isOpen={false}
              />
            ))}

            {hasMoreNotifications && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full p-2 text-xs text-primary hover:text-primary-hover font-medium transition-colors border border-primary/20 rounded-lg hover:bg-primary/5"
              >
                Ver todas ({notifications.length})
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="w-8 h-8 text-paragraph/30 mb-2" />
            <p className="text-sm text-paragraph/60">Nenhuma notificação</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <NotificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        notifications={notifications}
        onMarkAsRead={onMarkAsRead}
        onMarkAllAsRead={onMarkAllAsRead}
        onDelete={onDelete}
        onClearAll={onClearAll}
      />
    </div>
  );
};
