"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer as DrawerPrimitive } from "vaul";
import { useSidebar } from "@/context/SidebarContext";
import { UserCard, UserData } from "../UserCard/UserCard";
import {
  NotificationCard,
  NotificationBadge,
  Notification,
} from "../NotificationCard/NotificationCard";
import { signOut } from "next-auth/react";
import { ArrowDown, ArrowDownFromLine, ArrowUp, LogOut } from "lucide-react";
import { useMessages, useTranslations } from "next-intl";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { useIsStandalone } from "@/hooks/ui/useIsStandalone";
import { isPathActive } from "@/lib/utils";
import { SidebarItemType } from "@/types/ui/sidebar";
import MobileNavItem from "./MobileNavbarItem";
import SidebarItem from "./SidebarItem";

const handleLogout = () => {
  signOut({ callbackUrl: "/" });
};

// Mobile Bottom Drawer Component
interface MobileBottomDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SidebarItemType[];
  user?: UserData;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAllNotifications: () => void;
}

const MobileBottomDrawer: React.FC<MobileBottomDrawerProps> = ({
  open,
  onOpenChange,
  items,
  user,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAllNotifications,
}) => {
  const pathname = usePathname();
  const tItems = useTranslations("SidebarItems");
  const tSidebar = (useMessages()?.Sidebar ?? {}) as Record<string, string>;
  const [openSection, setOpenSection] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"menu" | "notifications">(
    "menu",
  );

  React.useEffect(() => {
    const activeSection = items.find((item) =>
      item.subItems?.some((sub) => isPathActive(pathname, sub.href)),
    );
    if (activeSection) {
      setOpenSection(activeSection.label);
    }
  }, [pathname, items]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 bg-slate-500/20 backdrop-blur-sm z-40 md:hidden" />

        <DrawerPrimitive.Content className="fixed bottom-0 left-0 right-0 bg-background dark:bg-slate-950 rounded-t-xl z-50 md:hidden flex flex-col outline-none shadow-2xl h-[85vh] max-h-[85vh]">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>

          <DrawerPrimitive.Description className="sr-only">
            Menu de navegação e notificações mobile
          </DrawerPrimitive.Description>
          <DrawerPrimitive.Title />
          <div className="px-4 py-3 shrink-0">
            <AnimatePresence mode="wait">
              {user && (
                <UserCard
                  user={user}
                  variant="mobile"
                  onLogout={handleLogout}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="flex border-b border-border shrink-0">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("menu")}
              className={twMerge(
                "flex-1 py-3 px-4 text-sm font-medium transition-colors relative",
                activeTab === "menu"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-red-500",
              )}
            >
              {tSidebar.menu ?? "Menu"}
              {activeTab === "menu" && (
                <motion.div
                  layoutId="activeTabMobile"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("notifications")}
              className={twMerge(
                "flex-1 py-3 px-4 text-sm font-medium transition-colors relative flex items-center justify-center gap-2",
                activeTab === "notifications"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{tSidebar.notifications ?? "Notificações"}</span>
              {unreadCount > 0 && (
                <NotificationBadge
                  count={unreadCount}
                  className="relative top-0 right-0"
                />
              )}
              {activeTab === "notifications" && (
                <motion.div
                  layoutId="activeTabMobile"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </motion.button>
          </div>

          <div className="overflow-y-auto flex-1 p-0">
            <AnimatePresence mode="wait">
              {activeTab === "menu" ? (
                <motion.nav
                  key="menu"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 pb-8"
                >
                  <ul className="space-y-2">
                    {items.map((item, index) => {
                      const Icon = item.Icon as any;
                      const iconNode = Icon ? (
                        <Icon {...(item.iconProps ?? {})} />
                      ) : (
                        item.icon
                      );

                      return (
                        <motion.li
                          key={item.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {item.subItems ? (
                            <div>
                              <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() =>
                                  setOpenSection(
                                    openSection === item.label
                                      ? null
                                      : item.label,
                                  )
                                }
                                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-5 h-5 flex items-center justify-center text-muted-foreground">
                                    {iconNode}
                                  </div>
                                  <span className="font-medium text-foreground">
                                    {item.labelKey
                                      ? tItems(item.labelKey)
                                      : item.label}
                                  </span>
                                </div>
                                <motion.div
                                  animate={{
                                    rotate:
                                      openSection === item.label ? 180 : 0,
                                  }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                                </motion.div>
                              </motion.button>

                              <AnimatePresence>
                                {openSection === item.label && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="ml-6 mt-2 space-y-1 border-l-2 border-border pl-4 overflow-hidden"
                                  >
                                    {item.subItems.map((subItem, subIndex) => {
                                      const isActive = isPathActive(
                                        pathname,
                                        subItem.href,
                                      );
                                      return (
                                        <motion.div
                                          key={subItem.href}
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{
                                            delay: subIndex * 0.05,
                                          }}
                                        >
                                          <Link
                                            href={subItem.href}
                                            onClick={() => onOpenChange(false)}
                                            className={twMerge(
                                              "flex items-center gap-3 p-2 rounded-lg transition-colors",
                                              isActive
                                                ? "bg-muted text-foreground font-medium"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                            )}
                                          >
                                            <div className="w-4 h-4 flex items-center justify-center">
                                              {subItem.icon}
                                            </div>
                                            <span className="text-sm">
                                              {subItem.label}
                                            </span>
                                          </Link>
                                        </motion.div>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ) : (
                            <Link
                              href={item.href}
                              onClick={() => onOpenChange(false)}
                              className={twMerge(
                                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                                isPathActive(pathname, item.href)
                                  ? "bg-muted text-foreground font-medium"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              )}
                            >
                              <div className="w-5 h-5 flex items-center justify-center">
                                {iconNode}
                              </div>
                              <span className="font-medium">
                                {item.labelKey
                                  ? tItems(item.labelKey)
                                  : item.label}
                              </span>
                            </Link>
                          )}
                        </motion.li>
                      );
                    })}
                  </ul>
                </motion.nav>
              ) : (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 pb-8"
                >
                  <NotificationCard
                    notifications={notifications}
                    onMarkAsRead={onMarkAsRead}
                    onMarkAllAsRead={onMarkAllAsRead}
                    onDelete={onDeleteNotification}
                    onClearAll={onClearAllNotifications}
                    isOpen={true}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

// --- Main Sidebar Component ---
export interface SidebarProps {
  items: SidebarItemType[];
  user?: UserData;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAllNotifications: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  items,
  user,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAllNotifications,
}) => {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const isStandalone = useIsStandalone();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const mobileItems = React.useMemo(
    () => items.filter((item) => !item.subItems),
    [items],
  );

  const mobileVisibleItems = React.useMemo(() => {
    const windowSize = 4;
    const activeIndex = mobileItems.findIndex((item) => item.href === pathname);
    const maxStart = Math.max(0, mobileItems.length - windowSize);

    const start =
      activeIndex >= 0
        ? Math.min(Math.floor(activeIndex / windowSize) * windowSize, maxStart)
        : 0;

    return mobileItems.slice(start, start + windowSize);
  }, [mobileItems, pathname]);

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{
          width: isCollapsed ? 48 : 256,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex flex-col items-center max-h-full"
      >
        <motion.div
          layout
          className={twMerge(
            "flex flex-col w-full h-full",
            !isCollapsed && "px-2 gap-3",
          )}
        >
          <AnimatePresence mode="wait">
            {user && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full"
              >
                <UserCard
                  user={user}
                  isCollapsed={isCollapsed}
                  className="w-full"
                  onLogout={handleLogout}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.nav
            layout
            className={twMerge(
              "flex flex-col gap-2 flex-1",
              isCollapsed && "w-fit",
              !isCollapsed && "w-full",
            )}
          >
            {items.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SidebarItem item={item} isCollapsed={isCollapsed} />
              </motion.div>
            ))}
          </motion.nav>

          <motion.div
            layout
            className={twMerge(
              "border-t border-primary/20 pt-3 w-full",
              isCollapsed && "border-none pt-0 mb-1",
            )}
          >
            <NotificationCard
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              onDelete={onDeleteNotification}
              onClearAll={onClearAllNotifications}
              isCollapsed={isCollapsed}
              isOpen={false}
            />
          </motion.div>

          <AnimatePresence>
            {handleLogout && isCollapsed && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLogout}
                className="p-2.5 self-center rounded-sm bg-destructive/10 hover:bg-destructive/20 text-destructive hover:text-destructive transition-all duration-300 ease-in-out"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.aside>

      {/* State 1: The Compact Navbar (Always rendered beneath the Drawer) */}
      <motion.nav
        key="mobile-navbar"
        className={twMerge(
          "md:hidden fixed bottom-0 left-0 right-0 px-4 py-2 z-40 flex items-center justify-between",
          isStandalone && "bg-slate-200! dark:bg-slate-900! border-none!",
          isMobile && "bg-slate-100 dark:bg-slate-950 border-t border-primary",
        )}
      >
        <motion.div className="flex items-center justify-between w-full">
          {mobileVisibleItems.map((item) => (
            <MobileNavItem key={item.label} item={item} />
          ))}

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMobileMenuOpen(true)}
            className="relative flex items-center justify-center p-2 flex-1 text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <motion.div
              animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 0] } : {}}
              transition={{
                duration: 0.5,
                repeat: unreadCount > 0 ? Infinity : 0,
                repeatDelay: 3,
              }}
              className="w-6 h-6 flex items-center justify-center"
            >
              <ArrowUp className="text-primary w-6 h-6" />
            </motion.div>
            {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
          </motion.button>
        </motion.div>
      </motion.nav>

      <MobileBottomDrawer
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
        items={items}
        user={user}
        notifications={notifications}
        onMarkAsRead={onMarkAsRead}
        onMarkAllAsRead={onMarkAllAsRead}
        onDeleteNotification={onDeleteNotification}
        onClearAllNotifications={onClearAllNotifications}
      />
    </>
  );
};

export { Sidebar };
export type { Notification };
