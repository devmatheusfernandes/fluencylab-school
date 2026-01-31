"use client";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useIsMobile } from "@/hooks/use-mobile";
import { MenuIcon } from "@/public/animated/menu";
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
          isMobile && "relative bg-slate-300 dark:bg-slate-950"
        )}
      >
        {onToggleSidebar && !isMobile && (
          <MenuIcon
            size={26}
            className="text-primary hover:text-foreground duration-300 ease-in-out transition-all cursor-pointer"
            onClick={onToggleSidebar}
          />
        )}
        <span
          className={twMerge(
            "font-semibold text-md text-foreground absolute left-1/2 -translate-x-1/2",
            
          )}
          aria-current="page"
        >
          {decodeURIComponent(currentItem.label)}
        </span>
        <div className="ml-auto">
          <ThemeSwitcher />
        </div>
      </nav>
    );
  }
);

Breadcrumb.displayName = "Breadcrumb";

export default Breadcrumb;
