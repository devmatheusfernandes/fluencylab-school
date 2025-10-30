"use client"; // This component uses client-side state and hooks

import * as React from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { useSidebar } from "@/context/SidebarContext";
import { UserCard, UserData } from "../UserCard/UserCard";
import {
  NotificationCard,
  NotificationBadge,
  Notification,
} from "../NotificationCard/NotificationCard";
import { signOut } from "next-auth/react";
import { ArrowDown, ArrowDownFromLine, ArrowUp, LogOut } from "lucide-react";
import { useMessages } from "next-intl";

// --- Type Definitions ---
export interface SubItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SidebarItemType {
  href: string;
  label: string;
  // Optional translation key to resolve label via messages
  labelKey?: string;
  icon?: React.ReactNode;
  subItems?: SubItem[];
}

// --- Sidebar Item Component ---
interface SidebarItemProps {
  item: SidebarItemType;
  isCollapsed: boolean;
}

const handleLogout = () => {
  signOut({ callbackUrl: "/" });
};

const SidebarItem: React.FC<SidebarItemProps> = ({ item, isCollapsed }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  if (item.subItems) {
    return (
      <Collapsible.Root className="w-full">
        <Collapsible.Trigger className="w-full">
          <div
            className={twMerge(
              "flex items-center h-12 px-3 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200",
              isActive && "bg-accent text-accent-foreground",
              isCollapsed && "justify-center px-3"
            )}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              {item.icon}
            </div>
            {!isCollapsed && (
              <span className="ml-3 flex-1 whitespace-nowrap text-left">
                {item.label}
              </span>
            )}
            {!isCollapsed && (
              <div className="w-5 h-5 flex items-center justify-center ml-auto">
                <ArrowDown className="w-5 h-5" />
              </div>
            )}
          </div>
        </Collapsible.Trigger>
        <Collapsible.Content className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div
            className={twMerge(
              "pl-6 flex flex-col gap-1 py-1",
              isCollapsed && "pl-0"
            )}
          >
            {item.subItems.map((subItem) => (
              <Link
                key={subItem.href}
                href={subItem.href}
                className={twMerge(
                  "flex items-center h-10 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200",
                  pathname === subItem.href && "bg-muted text-foreground",
                  isCollapsed && "justify-center px-3"
                )}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {subItem.icon}
                </div>
                {!isCollapsed && (
                  <span className="ml-3 whitespace-nowrap">
                    {subItem.label}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    );
  }

  return (
    <Link
      href={item.href}
      className={twMerge(
        "flex items-center h-12 px-3 py-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/15 transition-all ease-in-out duration-300",
        isActive && "bg-primary/30 text-primary font-semibold",
        isCollapsed && "justify-center px-3"
      )}
    >
      <div className="w-5 h-5 flex items-center justify-center">
        {item.icon}
      </div>
      {!isCollapsed && (
        <span className="ml-3 flex-1 whitespace-nowrap">{item.label}</span>
      )}
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
  const pathname = usePathname();
  const isActive = pathname === item.href;

  if (item.subItems) {
    return null;
  }

  return (
    <Link
      href={item.href}
      className={twMerge(
        "relative flex items-center justify-center transition-colors duration-200",
        isActive
          ? "bg-primary/15 rounded-full px-4 py-2 gap-2"
          : "p-2 text-muted-foreground hover:text-primary"
      )}
    >
      <div className="w-6 h-6 flex items-center justify-center text-primary">
        {item.icon}
      </div>
      {isActive && (
        <span className="text-sm font-medium text-primary-foreground whitespace-nowrap">
          {item.label}
        </span>
      )}
      {notificationCount && notificationCount > 0 && (
        <NotificationBadge count={notificationCount} />
      )}
    </Link>
  );
};

// --- Mobile Bottom Drawer Component ---
interface MobileBottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: SidebarItemType[];
  user?: UserData;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAllNotifications: () => void;
}

const MobileBottomDrawer: React.FC<MobileBottomDrawerProps> = ({
  isOpen,
  onClose,
  items,
  user,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAllNotifications,
}) => {
  const pathname = usePathname();
  const tSidebar = (useMessages()?.Sidebar ?? {}) as Record<string, string>;
  const [openSection, setOpenSection] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"menu" | "notifications">(
    "menu"
  );

  React.useEffect(() => {
    if (isOpen) {
      const activeSection = items.find((item) =>
        item.subItems?.some((sub) => pathname === sub.href)
      );
      if (activeSection) {
        setOpenSection(activeSection.label);
      }
    }
  }, [isOpen, pathname, items]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-500/20 backdrop-blur-sm z-99 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Bottom Drawer */}
      <div
        className={twMerge(
          "fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl z-199 md:hidden transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header with User Card */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              {activeTab === "menu"
                ? (tSidebar.menu ?? "Menu")
                : (tSidebar.notifications ?? "Notificações")}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowDownFromLine className="w-5 h-5" />
            </button>
          </div>
          {user && activeTab === "menu" && (
            <UserCard user={user} variant="mobile" onLogout={handleLogout} />
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("menu")}
            className={twMerge(
              "flex-1 py-3 px-4 text-sm font-medium transition-colors relative",
              activeTab === "menu"
                ? "text-primary"
                : "text-muted-foreground hover:text-red-500"
            )}
          >
            {tSidebar.menu ?? "Menu"}
            {activeTab === "menu" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={twMerge(
              "flex-1 py-3 px-4 text-sm font-medium transition-colors relative flex items-center justify-center gap-2",
              activeTab === "notifications"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
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
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[40vh] max-h-[65vh] overflow-y-auto">
          {activeTab === "menu" ? (
            <nav className="p-4">
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    {item.subItems ? (
                      <div>
                        <button
                          onClick={() =>
                            setOpenSection(
                              openSection === item.label ? null : item.label
                            )
                          }
                          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 flex items-center justify-center text-muted-foreground">
                              {item.icon}
                            </div>
                            <span className="font-medium text-foreground">
                              {item.label}
                            </span>
                          </div>
                          <ArrowDown
                            className={twMerge(
                              "w-4 h-4 text-muted-foreground transition-transform",
                              openSection === item.label && "rotate-180"
                            )}
                          />
                        </button>

                        {/* Sub-items */}
                        {openSection === item.label && (
                          <div className="ml-6 mt-2 space-y-1 border-l-2 border-border pl-4">
                            {item.subItems.map((subItem) => {
                              const isActive = pathname === subItem.href;
                              return (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  onClick={onClose}
                                  className={twMerge(
                                    "flex items-center gap-3 p-2 rounded-lg transition-colors",
                                    isActive
                                      ? "bg-muted text-foreground font-medium"
                                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                  )}
                                >
                                  <div className="w-4 h-4 flex items-center justify-center">
                                    {subItem.icon}
                                  </div>
                                  <span className="text-sm">
                                    {subItem.label}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={twMerge(
                          "flex items-center gap-3 p-3 rounded-lg transition-colors",
                          pathname === item.href
                            ? "bg-muted text-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <div className="w-5 h-5 flex items-center justify-center">
                          {item.icon}
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ) : (
            <div className="p-4">
              <NotificationCard
                notifications={notifications}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
                onDelete={onDeleteNotification}
                onClearAll={onClearAllNotifications}
                isOpen={true}
              />
            </div>
          )}
        </div>
      </div>
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
      <aside
        className={twMerge(
          "hidden md:flex flex-col items-center max-h-full transition-all duration-300 ease-in-out",
          isCollapsed ? "w-12" : "w-64 px-2 gap-3"
        )}
      >
        {/* User Card at top */}
        {user && (
          <UserCard
            user={user}
            isCollapsed={isCollapsed}
            className="w-full"
            onLogout={handleLogout}
          />
        )}
        {/* Navigation */}
        <nav
          className={twMerge(
            "flex flex-col gap-2 flex-1",
            isCollapsed && "w-fit",
            !isCollapsed && "w-full"
          )}
        >
          {items.map((item) => (
            <SidebarItem
              key={item.label}
              item={item}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>
        {/* Notifications at bottom */}
        <div
          className={twMerge(
            "border-t border-border pt-3 w-full",
            isCollapsed && "border-none pt-0"
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
        </div>
        {handleLogout && isCollapsed && (
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-sm bg-destructive/10 hover:bg-destructive/20 text-destructive hover:text-destructive transition-all duration-300 ease-in-out"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </aside>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-300 dark:bg-slate-950 border-t border-primary px-4 py-2 z-50">
        <div className="flex items-center justify-between">
          {items
            .filter((item) => !item.subItems)
            .slice(0, 4)
            .map((item) => (
              <MobileNavItem key={item.label} item={item} />
            ))}

          {/* More/Notifications button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="relative flex items-center justify-center p-2 text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <ArrowUp className="text-primary w-6 h-6" />
            </div>
            {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Drawer */}
      <MobileBottomDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
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
