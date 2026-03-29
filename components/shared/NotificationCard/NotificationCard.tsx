"use client";

import * as React from "react";
import { twMerge } from "tailwind-merge";
import { useState } from "react";
import { Bell, BrushCleaning } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

import type { Notification } from "../../../types/ui/notification";
import { NotificationBadge } from "./NotificationBadge";
import { NotificationItem } from "./NotificationItem";
import { NotificationModal } from "./NotificationModal";

export type { Notification } from "../../../types/ui/notification";
export { NotificationBadge } from "./NotificationBadge";

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
  const t = useTranslations("NotificationCard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const notifications = propNotifications.filter((n) => !n.read);
  const unreadCount = notifications.length;
  const hasNotifications = notifications.length > 0;

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
            transition={{
              duration: 0.5,
              repeat: unreadCount > 0 ? Infinity : 0,
              repeatDelay: 3,
            }}
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

  if (isMobile) {
    return (
      <div className={twMerge("w-full", className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
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
                  {t("markAll")}
                </motion.button>
              )}
              <span className="text-paragraph/40 text-xs">|</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClearAll}
                className="text-xs text-paragraph/60 hover:text-paragraph transition-colors"
              >
                {t("clear")}
              </motion.button>
            </div>
          )}
        </div>

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
                <p className="text-sm text-paragraph/60">
                  {t("noNotifications")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  const displayNotifications = notifications.slice(0, 1);
  const hasMoreNotifications = notifications.length > 2;

  return (
    <div className={twMerge("w-full", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
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
                {t("markAll")}
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
                  {t("viewAll", { count: notifications.length })}
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
              <p className="text-sm text-paragraph/60">
                {t("noNotifications")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
