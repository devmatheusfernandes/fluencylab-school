"use client";

import * as React from "react";
import { twMerge } from "tailwind-merge";
import { useState } from "react";
import { CheckCircle, Bell, MailWarning, X, BrushCleaning } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    const dateObj = typeof date === "string" ? new Date(date) : date;

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
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={twMerge(
          "flex items-center justify-center w-10 h-10 rounded-lg border cursor-pointer",
          notification.read
            ? "bg-surface border-surface-2 hover:bg-surface-hover"
            : "bg-primary/10 border-primary/20 hover:bg-primary/15"
        )}
        onClick={() => onMarkAsRead(notification.id)}
        title={notification.title}
      >
        {getTypeIcon()}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      layout
      className={twMerge(
        "group relative p-3 rounded-lg border transition-colors",
        notification.read
          ? "bg-surface border-surface-2 hover:bg-surface-hover"
          : "bg-primary/5 border-primary/10 hover:bg-primary/10"
      )}
    >
      {/* Unread indicator */}
      <AnimatePresence>
        {!notification.read && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"
          />
        )}
      </AnimatePresence>

      {/* Close button */}
      <motion.button
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1, scale: 1.1 }}
        onClick={() => onDelete(notification.id)}
        className="absolute top-2 right-6 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-surface-2 rounded"
      >
        <X className="w-3 h-3 text-paragraph" />
      </motion.button>

      <div className="flex items-start gap-3">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="mt-0.5"
        >
          {getTypeIcon()}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className={twMerge(
                "text-sm font-medium truncate",
                notification.read ? "text-paragraph" : "subtitle-base"
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
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 overflow-hidden"
              >
                {!notification.read && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onMarkAsRead(notification.id)}
                    className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                  >
                    Marcar como lida
                  </motion.button>
                )}

                {notification.action && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={notification.action.onClick}
                    className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                  >
                    {notification.action.label}
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
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
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className={twMerge(
        "absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[17px] h-[17px] flex items-center justify-center font-medium border-2 border-container",
        className
      )}
    >
      <motion.span
        key={count}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {count > 99 ? "99+" : count}
      </motion.span>
    </motion.div>
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black rounded-t-2xl border-t border-surface-2 z-50 max-h-[80vh] flex flex-col no-scrollbar"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <motion.div
                animate={{ scaleX: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-12 h-1 bg-surface-2 rounded-full"
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Bell className="w-4 h-4 text-paragraph" />
                </motion.div>
                <h3 className="text-lg font-semibold subtitle-base">
                  Todas as Notificações
                </h3>
                {unreadCount > 0 && (
                  <NotificationBadge
                    count={unreadCount}
                    className="relative top-0 right-0"
                  />
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
              >
                <X className="w-5 h-5 text-paragraph" />
              </motion.button>
            </div>

            {/* Actions */}
            <AnimatePresence>
              {hasNotifications && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-end gap-1 px-4 py-2 border-b border-surface-2 overflow-hidden"
                >
                  {unreadCount > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onMarkAllAsRead}
                      className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                    >
                      Marcar todas
                    </motion.button>
                  )}
                  <span className="text-paragraph/40 text-xs">|</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClearAll}
                    className="text-xs text-paragraph/60 hover:text-paragraph transition-colors"
                  >
                    Limpar
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                }}
                className="space-y-2"
              >
                <AnimatePresence mode="popLayout">
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
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-8 text-center"
                    >
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Bell className="w-8 h-8 text-paragraph/30 mb-2" />
                      </motion.div>
                      <p className="text-sm text-paragraph/60">
                        Nenhuma notificação
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
  notifications: propNotifications,
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
  
  // Ensure we only show unread notifications
  const notifications = propNotifications.filter(n => !n.read);
  const unreadCount = notifications.length;
  const hasNotifications = notifications.length > 0;

  // When collapsed, show only the Bell icon with badge
  if (isCollapsed) {
    return (
      <div className={twMerge("w-full flex justify-center", className)}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsModalOpen(true)}
          className="relative p-2 rounded-lg hover:bg-primary/30 hover:text-primary transition-colors"
        >
          <motion.div
            animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 0] } : {}}
            transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
          >
            <Bell className="w-5 h-5 text-paragraph" />
          </motion.div>
          {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
        </motion.button>

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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onMarkAllAsRead}
                  className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  Marcar todas
                </motion.button>
              )}
              <span className="text-paragraph/40 text-xs">|</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClearAll}
                className="text-xs text-paragraph/60 hover:text-paragraph transition-colors"
              >
                Limpar
              </motion.button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {hasNotifications ? (
              notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDelete}
                    isOpen={false}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Bell className="w-8 h-8 text-paragraph/30 mb-2" />
                </motion.div>
                <p className="text-sm text-paragraph/60">Nenhuma notificação</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // On desktop, show maximum 2 notifications with "View all" button
  const displayNotifications = notifications.slice(0, 1);
  const hasMoreNotifications = notifications.length > 2;

  return (
    <div className={twMerge("w-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-3 h-3 text-primary" />
          <h3 className="text-xs font-medium">Notificações</h3>
          {unreadCount > 0 && (
            <NotificationBadge
              count={unreadCount}
              className="relative top-0 right-0"
            />
          )}
        </div>

        {hasNotifications && !isOpen && (
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onMarkAllAsRead}
                className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
              >
                Marcar todas
              </motion.button>
            )}
            <span className="text-paragraph/40 text-xs">|</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClearAll}
            >
              <BrushCleaning className="cursor-pointer text-paragraph/60 hover:text-paragraph transition-colors w-3 h-3" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {hasNotifications ? (
            <>
              {displayNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  onClick={() => setIsModalOpen(true)}
                >
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDelete}
                    isOpen={false}
                  />
                </motion.div>
              ))}

              {hasMoreNotifications && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsModalOpen(true)}
                  className="w-full p-2 text-xs text-primary hover:text-primary-hover font-medium transition-colors border border-primary/20 rounded-lg hover:bg-primary/5"
                >
                  Ver todas ({notifications.length})
                </motion.button>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Bell className="w-8 h-8 text-paragraph/30 mb-2" />
              </motion.div>
              <p className="text-sm text-paragraph/60">Nenhuma notificação</p>
            </motion.div>
          )}
        </AnimatePresence>
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