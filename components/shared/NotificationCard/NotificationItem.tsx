"use client";

import * as React from "react";
import { twMerge } from "tailwind-merge";
import { CheckCircle, Bell, MailWarning, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Notification } from "../../../types/ui/notification";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  isCollapsed?: boolean;
  isOpen: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  isCollapsed = false,
  isOpen,
}) => {
  const t = useTranslations("NotificationCard");

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
      return t("invalidDate");
    }

    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - dateObj.getTime()) / (1000 * 60),
      );
      return t("minutesShort", { minutes: diffInMinutes });
    }
    if (diffInHours < 24) {
      return t("hoursShort", { hours: diffInHours });
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return t("daysShort", { days: diffInDays });
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
            : "bg-primary/10 border-primary/20 hover:bg-primary/15",
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
          : "bg-primary/5 border-primary/10 hover:bg-primary/10",
      )}
    >
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
                notification.read ? "text-paragraph" : "subtitle-base",
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
                    {t("markAsRead")}
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
