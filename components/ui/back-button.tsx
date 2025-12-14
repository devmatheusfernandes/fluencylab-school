"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export interface BackButtonProps {
  href?: string;
  routerBack?: boolean;
  ariaLabel?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  href = "/",
  routerBack = false,
  ariaLabel = "Back to landing page",
  className,
}) => {
  const router = useRouter();
  if (!routerBack && href) {
    return (
      <Link href={href} aria-label={ariaLabel}>
        <Button variant="ghost" size="icon" className={className}>
          <ArrowLeft className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </Button>
      </Link>
    );
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={ariaLabel}
      onClick={() => router.back()}
    >
      <ArrowLeft className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
    </Button>
  );
};
