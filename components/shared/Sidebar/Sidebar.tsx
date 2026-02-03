"use client";

import * as React from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
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

export interface SubItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SidebarItemType {
  href: string;
  label: string;
  labelKey?: string;
  icon?: React.ReactNode;
  subItems?: SubItem[];
  badgeCount?: number;
}

interface SidebarItemProps {
  item: SidebarItemType;
  isCollapsed: boolean;
}

const handleLogout = () => {
  signOut({ callbackUrl: "/" });
};

const SidebarItem: React.FC<SidebarItemProps> = ({ item, isCollapsed }) => {
  const t = useTranslations("SidebarItems");
  const pathname = usePathname();
  const isActive = pathname === item.href;

  const iconRef = React.useRef<any>(null);

  const handleMouseEnter = () => {
    iconRef.current?.startAnimation?.();
  };

  const handleMouseLeave = () => {
    iconRef.current?.stopAnimation?.();
  };

  if (item.subItems) {
    return (
      <Collapsible.Root className="w-full">
        <Collapsible.Trigger className="w-full">
          <motion.div
            whileHover={{ x: isCollapsed ? 0 : 4 }}
            whileTap={{ scale: 0.98 }}
            className={twMerge(
              "flex items-center h-12 px-3 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200",
              isActive && "bg-accent text-accent-foreground",
              isCollapsed && "justify-center px-3",
            )}
          >
            <motion.div
              whileHover={{ rotate: isCollapsed ? 0 : 5 }}
              className="w-5 h-5 flex items-center justify-center relative"
            >
              {item.icon}
              {isCollapsed && item.badgeCount && item.badgeCount > 0 ? (
                <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                  {item.badgeCount > 9 ? "9+" : item.badgeCount}
                </div>
              ) : null}
            </motion.div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="ml-3 flex-1 whitespace-nowrap text-left overflow-hidden flex items-center justify-between"
                >
                  {item.labelKey ? t(item.labelKey) : item.label}
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {item.badgeCount > 99 ? "99+" : item.badgeCount}
                    </span>
                  ) : null}
                </motion.span>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="w-5 h-5 flex items-center justify-center ml-auto"
                >
                  <ArrowDown className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Collapsible.Trigger>
        <Collapsible.Content className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={twMerge(
              "pl-6 flex flex-col gap-1 py-1",
              isCollapsed && "pl-0",
            )}
          >
            {item.subItems.map((subItem, index) => (
              <motion.div
                key={subItem.href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={subItem.href}
                  className={twMerge(
                    "flex items-center h-10 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200",
                    pathname === subItem.href && "bg-muted text-foreground",
                    isCollapsed && "justify-center px-3",
                  )}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {subItem.icon}
                  </div>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="ml-3 whitespace-nowrap"
                      >
                        {subItem.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </Collapsible.Content>
      </Collapsible.Root>
    );
  }

  return (
    <Link href={item.href}>
      <motion.div
        whileHover={{ x: isCollapsed ? 0 : 4, scale: isCollapsed ? 1.05 : 1 }}
        whileTap={{ scale: 0.98 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={twMerge(
          "flex items-center h-12 px-3 py-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/15 transition-all ease-in-out duration-300",
          isActive && "bg-primary/30 text-primary font-semibold",
          isCollapsed && "justify-center px-3",
        )}
      >
        <motion.div
          whileHover={{ rotate: isCollapsed ? 0 : 5 }}
          className="w-5 h-5 flex items-center justify-center relative"
        >
          {React.isValidElement(item.icon)
            ? React.cloneElement(item.icon as React.ReactElement<any>, {
                ref: iconRef,
              })
            : item.icon}
          {isCollapsed && item.badgeCount && item.badgeCount > 0 ? (
            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
              {item.badgeCount > 9 ? "9+" : item.badgeCount}
            </div>
          ) : null}
        </motion.div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="ml-3 flex-1 whitespace-nowrap overflow-hidden flex items-center justify-between"
            >
              {item.labelKey ? t(item.labelKey) : item.label}
              {item.badgeCount && item.badgeCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {item.badgeCount > 99 ? "99+" : item.badgeCount}
                </span>
              ) : null}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
};

// --- Mobile Navbar Item Component ---
interface MobileNavItemProps {
  item: SidebarItemType;
  notificationCount?: number;
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({
  item,
  notificationCount,
}) => {
  const t = useTranslations("SidebarItems");
  const pathname = usePathname();
  const isActive = pathname === item.href;

  if (item.subItems) {
    return null;
  }

  const badgeCount = notificationCount || item.badgeCount;

  return (
    <Link href={item.href} className="flex-1">
      <motion.div
        whileTap={{ scale: 0.9 }}
        className={twMerge(
          "relative flex items-center justify-center transition-colors duration-200 w-full h-full",
          isActive
            ? "bg-primary/15 rounded-full px-4 py-2 gap-2"
            : "p-2 text-muted-foreground hover:text-primary",
        )}
      >
        <motion.div
          animate={isActive ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
          className="w-6 h-6 flex items-center justify-center text-primary"
        >
          {item.icon}
        </motion.div>
        {/* Only show label if active and ample space, otherwise icon only on mobile usually looks cleaner, 
            but adhering to original design to show label on active */}
        <AnimatePresence>
          {isActive && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-sm font-medium text-foreground whitespace-nowrap overflow-hidden ml-2"
            >
              {item.labelKey ? t(item.labelKey) : item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {badgeCount && badgeCount > 0 && (
          <NotificationBadge count={badgeCount} />
        )}
      </motion.div>
    </Link>
  );
};

// --- Mobile Bottom Drawer Component ---
interface MobileBottomDrawerProps {
  onClose: () => void;
  items: SidebarItemType[];
  user?: UserData;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAllNotifications: () => void;
  layoutId: string;
}

const MobileBottomDrawer: React.FC<MobileBottomDrawerProps> = ({
  onClose,
  items,
  user,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAllNotifications,
  layoutId,
}) => {
  const pathname = usePathname();
  const tItems = useTranslations("SidebarItems");
  const tSidebar = (useMessages()?.Sidebar ?? {}) as Record<string, string>;
  const [openSection, setOpenSection] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"menu" | "notifications">(
    "menu",
  );

  React.useEffect(() => {
    // Determine active section based on current path
    const activeSection = items.find((item) =>
      item.subItems?.some((sub) => pathname === sub.href),
    );
    if (activeSection) {
      setOpenSection(activeSection.label);
    }
  }, [pathname, items]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Backdrop - Fades in separately */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-500/20 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />

      {/* The Drawer itself - Morphs from the Navbar using layoutId */}
      <motion.div
        layoutId={layoutId}
        className="fixed bottom-0 left-0 right-0 bg-background dark:bg-slate-950 border-t border-primary rounded-t-2xl z-50 md:hidden overflow-hidden flex flex-col shadow-2xl"
        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
      >
        {/* Content Wrapper - Fades in slightly after morph starts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col h-full max-h-[85vh]"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <motion.div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Header with User Card */}
          <div className="px-4 py-3 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">
                {activeTab === "menu"
                  ? (tSidebar.menu ?? "Menu")
                  : (tSidebar.notifications ?? "Notificações")}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowDownFromLine className="w-5 h-5" />
              </motion.button>
            </div>
            <AnimatePresence mode="wait">
              {user && activeTab === "menu" && (
                <UserCard
                  user={user}
                  variant="mobile"
                  onLogout={handleLogout}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Tabs */}
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

          {/* Scrollable Content */}
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
                    {items.map((item, index) => (
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
                                  {item.icon}
                                </div>
                                <span className="font-medium text-foreground">
                                  {item.labelKey
                                    ? tItems(item.labelKey)
                                    : item.label}
                                </span>
                              </div>
                              <motion.div
                                animate={{
                                  rotate: openSection === item.label ? 180 : 0,
                                }}
                                transition={{ duration: 0.2 }}
                              >
                                <ArrowDown className="w-4 h-4 text-muted-foreground" />
                              </motion.div>
                            </motion.button>

                            {/* Sub-items */}
                            <AnimatePresence>
                              {openSection === item.label && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="ml-6 mt-2 space-y-1 border-l-2 border-border pl-4 overflow-hidden"
                                >
                                  {item.subItems.map((subItem, subIndex) => {
                                    const isActive = pathname === subItem.href;
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
                                          onClick={onClose}
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
                            onClick={onClose}
                            className={twMerge(
                              "flex items-center gap-3 p-3 rounded-lg transition-colors",
                              pathname === item.href
                                ? "bg-muted text-foreground font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            <div className="w-5 h-5 flex items-center justify-center">
                              {item.icon}
                            </div>
                            <span className="font-medium">
                              {item.labelKey
                                ? tItems(item.labelKey)
                                : item.label}
                            </span>
                          </Link>
                        )}
                      </motion.li>
                    ))}
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
        </motion.div>
      </motion.div>
    </>
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
  const { isCollapsed } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

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
          {/* User Card at top */}
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

          {/* Navigation */}
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

          {/* Notifications at bottom */}
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

          {/* Logout button when collapsed */}
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

      {/* --- Mobile Interaction Section --- */}
      <LayoutGroup>
        <AnimatePresence mode="popLayout">
          {isMobileMenuOpen ? (
            // State 2: The Expanded Drawer
            <MobileBottomDrawer
              key="mobile-drawer"
              layoutId="mobile-sidebar"
              onClose={() => setIsMobileMenuOpen(false)}
              items={items}
              user={user}
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              onDeleteNotification={onDeleteNotification}
              onClearAllNotifications={onClearAllNotifications}
            />
          ) : (
            // State 1: The Compact Navbar
            <motion.nav
              key="mobile-navbar"
              layoutId="mobile-sidebar"
              className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-200 dark:bg-slate-950 border-t border-primary px-4 py-2 z-50 flex items-center justify-between"
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            >
              {/* Content Container - Fades out on open */}
              <motion.div
                className="flex items-center justify-between w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {items
                  .filter((item) => !item.subItems)
                  .slice(0, 4)
                  .map((item) => (
                    <MobileNavItem key={item.label} item={item} />
                  ))}

                {/* More/Open Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="relative flex items-center justify-center p-2 flex-1 text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  <motion.div
                    animate={
                      unreadCount > 0 ? { rotate: [0, -10, 10, -10, 0] } : {}
                    }
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
          )}
        </AnimatePresence>
      </LayoutGroup>
    </>
  );
};

export { Sidebar };
export type { Notification };
