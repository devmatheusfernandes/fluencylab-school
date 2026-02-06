"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface BreadcrumbActionIconProps {
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
}

export default function BreadcrumbActionIcon({
  icon: Icon,
  onClick,
  className,
}: BreadcrumbActionIconProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-2.5 h-10 w-10 text-foreground transition-opacity active:opacity-70 focus:outline-none",
        className,
      )}
      type="button"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
