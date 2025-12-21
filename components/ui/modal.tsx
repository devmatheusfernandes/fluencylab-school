"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { twMerge } from "tailwind-merge";
import { VisuallyHidden } from "./visually-hidden";

import Image from "next/image";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { defaultIcons } from "./modal-icons";
import { X } from "lucide-react";
import { Input } from "./input";

// Modal Root Component
const Modal = Dialog.Root;

// Modal Trigger Component
const ModalTrigger = Dialog.Trigger;

// Modal Portal Component
const ModalPortal = Dialog.Portal;

// Modal Overlay Component
const ModalOverlay = React.forwardRef<
  React.ComponentRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, ...props }, ref) => {
  return (
    <Dialog.Overlay
      ref={ref}
      className={twMerge(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
});
ModalOverlay.displayName = "ModalOverlay";

// Modal Content Component (Bottom Sheet Style)
const ModalContent = React.forwardRef<
  React.ComponentRef<typeof motion.div>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content> & {
    showHandle?: boolean;
  } & HTMLMotionProps<"div">
>(({ className, children, showHandle = true, ...props }, ref) => {
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <Dialog.Portal>
      <AnimatePresence>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
          >
            <Dialog.Content
              className={twMerge(
                `relative w-full max-w-lg mx-4 mb-4 sm:mb-6
                bg-white dark:bg-gray-900/95 
                backdrop-blur-xl
                rounded-2xl shadow-2xl
                border border-gray-200/50 dark:border-gray-700/50
                overflow-hidden`,
                className
              )}
              asChild
              {...props}
            >
              <motion.div
                ref={ref}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  duration: 0.3,
                }}
              >
                {/* Handle Bar */}
                {showHandle && (
                  <div className="flex justify-center pt-4 pb-6">
                    <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                  </div>
                )}

                {/* Hidden title for accessibility - required by Radix UI Dialog */}
                <VisuallyHidden>
                  <Dialog.Title>Modal</Dialog.Title>
                </VisuallyHidden>

                <div className="px-6 pb-6">{children}</div>
              </motion.div>
            </Dialog.Content>
          </motion.div>
        </Dialog.Overlay>
      </AnimatePresence>
    </Dialog.Portal>
  );
});
ModalContent.displayName = "ModalContent";

// Modal Header Component
const ModalHeader = React.forwardRef<
  React.ComponentRef<typeof motion.div>,
  React.HTMLAttributes<HTMLDivElement> & {
    showCloseButton?: boolean;
  } & HTMLMotionProps<"div">
>(({ className, showCloseButton = true, children, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.2 }}
      className={twMerge(
        "flex items-center justify-between pb-4",
        !showCloseButton && "justify-center",
        className
      )}
      {...props}
    >
      <div
        className={`flex flex-col space-y-2 ${showCloseButton ? "flex-1" : "text-center"}`}
      >
        {children}
      </div>
    </motion.div>
  );
});
ModalHeader.displayName = "ModalHeader";

// Modal Title Component
const ModalTitle = React.forwardRef<
  React.ComponentRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(({ className, ...props }, ref) => {
  return (
    <Dialog.Title
      ref={ref}
      className={twMerge(
        "text-xl font-bold text-center leading-tight tracking-tight text-gray-900 dark:text-gray-100",
        className
      )}
      {...props}
    />
  );
});
ModalTitle.displayName = "ModalTitle";

// Modal Description Component
const ModalDescription = React.forwardRef<
  React.ComponentRef<typeof motion.div>,
  React.ComponentPropsWithoutRef<typeof Dialog.Description> &
    HTMLMotionProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.2 }}
      {...props}
    >
      <Dialog.Description
        className={twMerge(
          "text-sm text-gray-600 dark:text-gray-400 leading-relaxed",
          className
        )}
      />
    </motion.div>
  );
});
ModalDescription.displayName = "ModalDescription";

// Modal Close Component
const ModalClose = React.forwardRef<
  React.ComponentRef<typeof motion.div>,
  React.ComponentPropsWithoutRef<typeof Dialog.Close> & HTMLMotionProps<"div">
>(({ className, children, ...props }, ref) => {
  return (
    <Dialog.Close
      className={twMerge(
        "absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800",
        className
      )}
      {...props}
    >
      {children || (
        <>
          <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
          >
            <X size={24} />
          </motion.div>
        </>
      )}
    </Dialog.Close>
  );
});

ModalClose.displayName = "ModalClose";

// Modal Footer Component
const ModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & HTMLMotionProps<"div">) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.2 }}
      className={twMerge(
        "flex flex-row justify-end gap-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50",
        className
      )}
      {...props}
    />
  );
};
ModalFooter.displayName = "ModalFooter";

// Modal Icon Container Component
const ModalIcon = ({
  className,
  type = "info",
  src,
  alt = "",
  children,
  ...props
}: {
  className?: string;
  type?:
    | "info"
    | "warning"
    | "error"
    | "success"
    | "delete"
    | "confirm"
    | "close"
    | "settings"
    | "user"
    | "edit"
    | "download"
    | "upload"
    | "search"
    | "notification"
    | "heart"
    | "star"
    | "calendar"
    | "lock"
    | "unlock"
    | "home"
    | "document";
  src?: string;
  alt?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement> &
  HTMLMotionProps<"div">) => {
  const iconContent =
    children ||
    (src ? (
      <Image
        src={src}
        alt={alt}
        width={48}
        height={48}
        className="w-12 h-12 object-cover rounded-full"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          const fallbackIcon = target.nextElementSibling as HTMLElement;
          if (fallbackIcon) {
            fallbackIcon.style.display = "flex";
          }
        }}
      />
    ) : (
      defaultIcons[type]
    ));

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.3, type: "spring" }}
      className={twMerge("flex justify-center items-center mb-4", className)}
      {...props}
    >
      {src ? (
        <div className="relative">
          <Image
            src={src}
            alt={alt}
            width={48}
            height={48}
            className="w-12 h-12 object-cover rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const fallback = target.parentElement?.querySelector(
                ".fallback-icon"
              ) as HTMLElement;
              if (fallback) {
                fallback.style.display = "flex";
              }
            }}
          />
          <div className="fallback-icon hidden justify-center items-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full">
            {defaultIcons[type]}
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full">
          {iconContent}
        </div>
      )}
    </motion.div>
  );
};
ModalIcon.displayName = "ModalIcon";

// Modal Body Component
const ModalBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & HTMLMotionProps<"div">) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.2 }}
      className={twMerge("space-y-4 py-2", className)}
      {...props}
    />
  );
};
ModalBody.displayName = "ModalBody";

// Modal Form Component
const ModalForm = React.forwardRef<
  React.ComponentRef<typeof motion.form>,
  React.FormHTMLAttributes<HTMLFormElement> & HTMLMotionProps<"form">
>(({ className, ...props }, ref) => {
  return (
    <motion.form
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.2 }}
      className={twMerge("space-y-4", className)}
      {...props}
    />
  );
});
ModalForm.displayName = "ModalForm";

// Modal Field Component
const ModalField = ({
  label,
  required,
  error,
  children,
  className,
  ...props
}: {
  label?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement> &
  HTMLMotionProps<"div">) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1, duration: 0.2 }}
      className={twMerge("space-y-2", className)}
      {...props}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </motion.div>
  );
};
ModalField.displayName = "ModalField";

// Modal Input Component
const ModalInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof Input> & {
    error?: boolean;
    containerProps?: HTMLMotionProps<"div">;
  }
>(({ className, containerProps, error, ...props }, ref) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.2 }}
      {...containerProps}
    >
      <Input
        ref={ref}
        className={twMerge(
          "h-12 px-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl",
          className
        )}
        {...props}
      />
    </motion.div>
  );
});
ModalInput.displayName = "ModalInput";

// Primary Button Component
const ModalPrimaryButton = React.forwardRef<
  React.ComponentRef<typeof motion.button>,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "destructive" | "secondary";
  } & HTMLMotionProps<"button">
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default:
      "bg-primary hover:bg-primary-hover dark:bg-primary dark:hover:bg-primary-hover",
    destructive:
      "bg-destructive hover:bg-destructive-hover dark:bg-destructive dark:hover:bg-destructive-hover",
    secondary:
      "bg-secondary hover:bg-secondary-hover dark:bg-secondary dark:hover:bg-secondary-hover",
  };

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={twMerge(
        `min-w-fit flex flex-1 items-center justify-center flex-row gap-2 px-6 py-3 text-base font-semibold text-white rounded-xl 
        transition-all duration-150 focus:outline-none 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}`,
        className
      )}
      {...props}
    />
  );
});
ModalPrimaryButton.displayName = "ModalPrimaryButton";

// Secondary Button Component
const ModalSecondaryButton = React.forwardRef<
  React.ComponentRef<typeof motion.button>,
  React.ButtonHTMLAttributes<HTMLButtonElement> & HTMLMotionProps<"button">
>(({ className, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={twMerge(
        `min-w-fit px-6 py-3 text-base font-semibold 
        text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200
        bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
        rounded-xl transition-all duration-150
        border border-gray-200/50 dark:border-gray-600/50 
        hover:border-gray-300/70 dark:hover:border-gray-500/70
        disabled:opacity-50 disabled:cursor-not-allowed`,
        className
      )}
      {...props}
    />
  );
});
ModalSecondaryButton.displayName = "ModalSecondaryButton";

export {
  Modal,
  ModalTrigger,
  ModalPortal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalClose,
  ModalBody,
  ModalForm,
  ModalField,
  ModalInput,
  ModalFooter,
  ModalIcon,
  ModalPrimaryButton,
  ModalSecondaryButton,
};
