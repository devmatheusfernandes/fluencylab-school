import * as React from "react";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "./button";

export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The main heading text
   */
  heading: string;
  /**
   * The subheading text below the main heading
   */
  subheading?: string;
  /**
   * The icon to display on the far right
   */
  icon?: React.ReactNode;
  /**
   * The size of the heading
   * @default '2xl'
   */
  headingSize?: "xl" | "2xl" | "3xl" | "4xl";
  /**
   * The size of the subheading
   * @default 'lg'
   */
  subheadingSize?: "sm" | "base" | "lg" | "xl";
  /**
   * Optional URL for the back button. If provided, a back arrow will be displayed.
   */
  backHref?: string;
}

const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  (
    {
      heading,
      subheading,
      icon,
      headingSize = "2xl",
      subheadingSize = "lg",
      backHref,
      className,
      ...props
    },
    ref
  ) => {
    const headingSizeClasses = {
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
    };

    const subheadingSizeClasses = {
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    };

    return (
      <div
        ref={ref}
        className={twMerge(
          "flex items-start justify-between gap-4",
          className
        )}
        {...props}
      >
        <div className="flex-1 min-w-0 flex items-start gap-4">
          {backHref && (
            <Link
              href={backHref}
              className={buttonVariants({
                variant: "ghost",
                size: "icon",
                className: "shrink-0 -ml-2",
              })}
            >
              <ArrowLeft className="h-6 w-6" />
              <span className="sr-only">Voltar</span>
            </Link>
          )}
          <div>
            <h1
              className={twMerge(
                "font-bold title-base leading-tight tracking-tight",
                headingSizeClasses[headingSize]
              )}
            >
              {heading}
            </h1>
            {subheading && (
              <p
                className={twMerge(
                  "text-subtitle leading-relaxed",
                  subheadingSizeClasses[subheadingSize]
                )}
              >
                {subheading}
              </p>
            )}
          </div>
        </div>
        {icon && (
          <div className="flex-shrink-0 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
    );
  }
);

Header.displayName = "Header";

export { Header };
