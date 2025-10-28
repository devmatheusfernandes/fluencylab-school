"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export interface BackButtonProps {
  href?: string;
  ariaLabel?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  href = "/",
  ariaLabel = "Back to landing page",
  className,
}) => {
  return (
    <Link href={href} aria-label={ariaLabel}>
      <Button variant="ghost" size="icon" className={className}>
        <ArrowLeft className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      </Button>
    </Link>
  );
};
