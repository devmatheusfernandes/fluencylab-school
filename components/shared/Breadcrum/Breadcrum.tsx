"use client";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "lucide-react";
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

    if (!currentItem) {
      return null;
    }

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={twMerge(
          "flex items-center justify-between w-full text-sm bg-slate-400/30 dark:bg-slate-900 rounded-none sm:rounded-t-lg py-1 px-3",
          className,
          useIsMobile() && "bg-slate-300 dark:bg-slate-950"
        )}
      >
        {onToggleSidebar && !useIsMobile() && (
          <Sidebar
            className="text-primary hover:text-secondary duration-300 ease-in-out transition-all cursor-pointer w-6.5 h-6.5"
            onClick={onToggleSidebar}
          />
        )}
        <span
          className="font-semibold text-md text-foreground"
          aria-current="page"
        >
          {currentItem.label}
        </span>
        <ThemeSwitcher />
      </nav>
    );
  }
);

Breadcrumb.displayName = "Breadcrumb";

export default Breadcrumb;
