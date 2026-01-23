import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { twMerge } from "tailwind-merge";

// Define the component's props with all the possible variants
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The visual style of the button.
   * @default 'primary'
   */
  variant?:
    | "primary"
    | "secondary"
    | "warning"
    | "success"
    | "info"
    | "ghost"
    | "outline"
    | "glass"
    | "link"
    | "gradient"
    | "destructive";
  /**
   * The size of the button.
   * @default 'base'
   */
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "icon";
  /**
   * If true, the button will be renderose as its child component.
   * This is useful for wrapping components like Next.js's <Link>.
   * @default false
   */
  asChild?: boolean;
  /**
   * If true, a loading spinner will be shown, and the button will be disabled.
   * @default false
   */
  isLoading?: boolean;
  /**
   * Optional icon to display before the text
   */
  leftIcon?: React.ReactNode;
  /**
   * Optional icon to display after the text
   */
  rightIcon?: React.ReactNode;
  /**
   * If true, the button will take the full width of its container
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Animation style for the button
   * @default 'scale'
   */
  animation?: "scale" | "bounce" | "pulse" | "none";
}

// Helper function to generate the correct Tailwind classes
const getButtonClasses = ({
  variant,
  size,
  fullWidth,
  animation,
}: Pick<
  ButtonProps,
  "variant" | "size" | "fullWidth" | "animation"
>): string => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium border transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

  // Animation classes
  const animationClasses = {
    scale: "transform active:scale-[0.98] disabled:active:scale-100",
    bounce: "hover:animate-bounce",
    pulse: "hover:animate-pulse",
    none: "",
  };

  const variantClasses = {
    primary:
      "bg-primary hover:contrast-140 border-primary text-white dark:text-foreground focus-visible:ring-ring relative overflow-hidden transition-all ease-in-out duration-300",
    secondary:
      "bg-secondary border-secondary text-secondary-foreground focus-visible:ring-ring hover:opacity-95",
    destructive:
      "bg-destructive border-destructive text-white focus-visible:ring-destructive hover:opacity-95",
    warning:
      "bg-yellow-500 border-yellow-500 text-white hover:bg-yellow-600 hover:border-yellow-600 focus-visible:ring-yellow-500",
    success:
      "bg-teal-600 border-teal-600 text-white hover:bg-teal-700 hover:border-teal-700 focus-visible:ring-teal-500",
    info: "bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700 hover:border-cyan-700 focus-visible:ring-cyan-500",
    ghost:
      "bg-transparent border-transparent text-foreground hover:bg-white/20 hover:text-foreground focus-visible:ring-ring",
    outline:
      "input-base",
    glass:
      "bg-white/10 backdrop-blur-md border-white/20 text-black dark:text-white hover:bg-white/20 hover:border-white/30 focus-visible:ring-white/50",
    link: "bg-transparent border-transparent text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-500 dark:text-blue-400 p-0 h-auto",
    gradient:
      "bg-gradient-to-r from-blue-600 to-purple-600 border-transparent text-white hover:from-blue-700 hover:to-purple-700 focus-visible:ring-purple-500",
  };

  const sizeClasses = {
    xs: "px-2.5 py-1.5 text-xs h-7",
    sm: "px-3 py-2 text-sm h-8",
    base: "px-4 py-2.5 text-sm h-10",
    lg: "px-6 py-3 text-base h-12",
    xl: "px-8 py-4 text-lg h-14",
    icon: "p-2.5 h-10 w-10",
  };

  const widthClasses = fullWidth ? "w-full" : "";

  return twMerge(
    baseClasses,
    variantClasses[variant || "primary"],
    sizeClasses[size || "base"],
    animationClasses[animation || "scale"],
    widthClasses
  );
};

// Loading spinner component
const LoadingSpinner = ({ size }: { size?: ButtonProps["size"] }) => {
  const spinnerSizes = {
    xs: "h-3 w-3",
    sm: "h-3 w-3",
    base: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-6 w-6",
    icon: "h-4 w-4",
  };

  return (
    <svg
      className={twMerge("animate-spin", spinnerSizes[size || "base"])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      animation = "scale",
      children,
      ...props
    },
    ref
  ) => {
    // Use Slot if asChild is true, otherwise use a regular button
    const Comp = asChild ? Slot : "button";

    // Don't show icons when loading (except for icon-only buttons)
    const showLeftIcon = !isLoading && leftIcon;
    const showRightIcon = !isLoading && rightIcon;
    const showChildren = size !== "icon" || !isLoading;

    if (asChild) {
      return (
        <Comp
          className={twMerge(
            getButtonClasses({ variant, size, fullWidth, animation }),
            className
          )}
          data-variant={variant}
          data-size={size}
          ref={ref}
          disabled={isLoading || props.disabled}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={twMerge(
          getButtonClasses({ variant, size, fullWidth, animation }),
          className
        )}
        data-variant={variant}
        data-size={size}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && <LoadingSpinner size={size} />}

        {/* Left icon */}
        {showLeftIcon && (
          <span className="shrink-0 relative z-10">{leftIcon}</span>
        )}

        {/* Button content */}
        {showChildren && (
          <span
            className={twMerge(
              "flex items-center justify-center relative z-10",
              (showLeftIcon || showRightIcon || isLoading) && "truncate"
            )}
          >
            {children}
          </span>
        )}

        {/* Right icon */}
        {showRightIcon && (
          <span className="shrink-0 relative z-10">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

// Lightweight compatibility helper to produce classes per variant/size,
// mirroring the signature used across the codebase.
function buttonVariants({
  variant,
  size,
  className,
}: {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  return twMerge(
    getButtonClasses({
      variant,
      size,
      fullWidth: false,
      animation: "none",
    }),
    className
  );
}

export { Button, buttonVariants };
