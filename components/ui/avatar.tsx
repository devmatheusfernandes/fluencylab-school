"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { twMerge } from "tailwind-merge";

// --- Utility function to extract initials from a name ---
function getInitials(name: string | undefined | null): string {
  if (!name) return "?";

  const cleanedName = name.trim();
  if (!cleanedName) return "?";

  const words = cleanedName.split(/\s+/).filter((word) => word.length > 0);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();

  // For multiple words, take the first letter of the first and last words
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

// --- Main Avatar Component (Root) ---
const Avatar = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    /** Optional status indicator for the avatar. */
    status?: "online" | "offline";
    /** Size variant for responsive design */
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  }
>(({ className, status, size = "md", children, ...props }, ref) => {
  const sizeClasses = {
    xs: "h-6 w-6 sm:h-8 sm:w-8",
    sm: "h-8 w-8 sm:h-10 sm:w-10",
    md: "h-12 w-12 sm:h-14 sm:w-14 md:h-17 md:w-17",
    lg: "h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20",
    xl: "h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24",
    "2xl": "h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32",
  };

  const statusSizeClasses = {
    xs: "h-1.5 w-1.5 sm:h-2 sm:w-2 bottom-0 right-0 border-1",
    sm: "h-2 w-2 sm:h-2.5 sm:w-2.5 bottom-0.5 right-0.5 border-1",
    md: "h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 border-2",
    lg: "h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 bottom-1 right-1 border-2",
    xl: "h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 border-2",
    "2xl":
      "h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 border-2 sm:border-3",
  };

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={twMerge(
        "relative flex shrink-0 overflow-hidden rounded-2xl transition-all duration-200",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
      {/* Render the status badge if the status prop is provided */}
      {status && (
        <span
          className={twMerge(
            "absolute block rounded-full border-background ring-1 ring-background",
            statusSizeClasses[size],
            status === "online" && "bg-green-500",
            status === "offline" && "bg-subtitle"
          )}
          aria-label={status === "online" ? "Online" : "Offline"}
        />
      )}
    </AvatarPrimitive.Root>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

// --- Styled Image with Loading State ---
const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
    /** Size variant to ensure proper scaling */
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  }
>(({ className, size = "md", ...props }, ref) => {
  const imageSizeClasses = {
    xs: "h-6 w-6 sm:h-8 sm:w-8",
    sm: "h-8 w-8 sm:h-10 sm:w-10",
    md: "h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14",
    lg: "h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20",
    xl: "h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24",
    "2xl": "h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32",
  };

  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = React.useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  // If there's no source or there's an error, don't render the image component
  if (!props.src || hasError) {
    return null;
  }

  return (
    <>
      <AvatarPrimitive.Image
        ref={ref}
        className={twMerge(
          "aspect-square object-cover rounded-2xl",
          imageSizeClasses[size],
          className,
          isLoading && "hidden"
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      {isLoading && (
        <div
          className={twMerge(
            "absolute inset-0 flex items-center justify-center rounded-2xl bg-container/80",
            imageSizeClasses[size]
          )}
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-subtitle border-t-transparent" />
        </div>
      )}
    </>
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

// --- Styled Fallback ---
const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    /** Size variant to adjust text size */
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
    /** Name to generate initials from */
    name?: string;
  }
>(({ className, size = "md", name, children, ...props }, ref) => {
  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-sm sm:text-base md:text-lg",
    lg: "text-base sm:text-lg md:text-xl",
    xl: "text-lg sm:text-xl md:text-2xl",
    "2xl": "text-xl sm:text-2xl md:text-3xl lg:text-4xl",
  };

  // Use provided children or generate initials from name
  const fallbackContent = children || getInitials(name);

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={twMerge(
        "capitalize flex h-full w-full items-center justify-center rounded-2xl bg-container/80 text-subtitle border-1 border-container/50 font-semibold",
        textSizeClasses[size],
        className
      )}
      {...props}
    >
      {fallbackContent}
    </AvatarPrimitive.Fallback>
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback, getInitials };
