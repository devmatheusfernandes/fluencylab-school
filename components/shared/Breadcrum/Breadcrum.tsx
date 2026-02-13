"use client";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useIsStandalone } from "@/hooks/ui/useIsStandalone";
import { useIsMobile } from "@/hooks/ui/useMobile";
import LayoutSidebarRightIcon from "@/public/animated/layout-sidebar-right-icon";
import * as React from "react";
import { twMerge } from "tailwind-merge";

type BreadcrumbItem = {
  label: string;
  href: string;
};

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  onToggleSidebar?: () => void;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ items, className, onToggleSidebar }, ref) => {
    const currentItem =
      items && items.length > 0 ? items[items.length - 1] : null;
    const isMobile = useIsMobile();
    const isStandalone = useIsStandalone();

    if (!currentItem) {
      return null;
    }

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={twMerge(
          "header-base flex items-center justify-between w-full text-sm rounded-none sm:rounded-t-lg py-1 px-3",
          className,
          isMobile &&
            "relative bg-slate-100! dark:bg-slate-950! border-b border-slate-200 dark:border-b dark:border-slate-800! sticky top-0 z-10",
          isStandalone &&
            "bg-slate-200! dark:bg-slate-900! border-t-none! border-b-none! dark:border-t-none! dark:border-b-none! dark:border-transparent!",
        )}
      >
        {onToggleSidebar && !isMobile && (
          <LayoutSidebarRightIcon
            size={26}
            className="text-primary hover:text-foreground duration-300 ease-in-out transition-all cursor-pointer"
            onClick={onToggleSidebar}
          />
        )}
        <div
          id="breadcrumb-mobile-start-actions"
          className="flex items-center md:hidden"
        />
        {isStandalone ? (
          <span
            className="font-semibold text-lg text-foreground pl-2 py-1.5"
            aria-current="page"
          >
            {decodeURIComponent(currentItem.label)}
          </span>
        ) : (
          <span
            className={twMerge(
              "font-semibold text-md text-foreground absolute left-1/2 -translate-x-1/2",
            )}
            aria-current="page"
          >
            {decodeURIComponent(currentItem.label)}
          </span>
        )}
        <div className="ml-auto flex items-center">
          {isStandalone ? (
            <div
              id="breadcrumb-mobile-actions"
              className="flex items-center md:hidden"
            />
          ) : (
            <ThemeSwitcher />
          )}
        </div>
      </nav>
    );
  },
);

Breadcrumb.displayName = "Breadcrumb";

export default Breadcrumb;
