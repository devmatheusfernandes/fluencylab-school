"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Bell, X } from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import type { Notification } from "../../../types/ui/notification";
import { NotificationBadge } from "./NotificationBadge";
import { NotificationItem } from "./NotificationItem";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
}) => {
  const t = useTranslations("NotificationCard");
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasNotifications = notifications.length > 0;

  return (
    <DrawerPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />

        <DrawerPrimitive.Content className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black rounded-t-2xl border-t border-surface-2 z-50 max-h-[80vh] flex flex-col outline-none no-scrollbar shadow-2xl">
          <DrawerPrimitive.Description className="sr-only">
            Lista de notificações recentes
          </DrawerPrimitive.Description>

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <motion.div
              animate={{ scaleX: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-12 h-1 bg-surface-2 rounded-full"
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2 shrink-0">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Bell className="w-4 h-4 text-paragraph" />
              </motion.div>
              <DrawerPrimitive.Title className="text-lg font-semibold subtitle-base">
                {t("allNotifications")}
              </DrawerPrimitive.Title>
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

          {/* Action Bar */}
          <AnimatePresence>
            {hasNotifications && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-end gap-1 px-4 py-2 border-b border-surface-2 overflow-hidden shrink-0"
              >
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* List Content */}
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
                      {t("noNotifications")}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};
