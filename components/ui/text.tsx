import * as React from "react";
import { twMerge } from "tailwind-merge";

// Define the component's props with all the possible variants
export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /**
   * The HTML element to render. Defaults to 'p'.
   */
  as?: "p" | "span" | "div" | "label";
  /**
   * The color variant of the text, mapped to your theme.
   */
  variant?:
    | "title"
    | "subtitle"
    | "paragraph"
    | "placeholder"
    | "primary"
    | "secondary"
    | "error";
  /**
   * The font size of the text.
   */
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  /**
   * The font weight of the text.
   */
  weight?: "normal" | "medium" | "semibold" | "bold";
}

// Helper function to generate the correct Tailwind classes based on props
const getTextClasses = ({
  variant,
  size,
  weight,
}: Omit<TextProps, "as" | "className">): string => {
  const variantClasses = {
    title: "text-title",
    subtitle: "text-subtitle",
    paragraph: "text-paragraph",
    placeholder: "text-placeholder",
    primary: "text-primary",
    secondary: "text-secondary",
    error: "text-error",
  };

  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
  };

  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };

  // Base classes applied to all variants
  const baseClasses = "transition-colors";

  return [
    baseClasses,
    variantClasses[variant || "paragraph"], // Default to 'paragraph'
    sizeClasses[size || "base"], // Default to 'base'
    weightClasses[weight || "normal"], // Default to 'normal'
  ].join(" ");
};

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant, size, weight, as = "p", ...props }, ref) => {
    // 1. Generate the variant classes using our helper function
    const variantClasses = getTextClasses({ variant, size, weight });

    // 2. Merge them with any custom classes passed via props
    const finalClassName = twMerge(variantClasses, className);

    // Use conditional rendering based on the 'as' prop
    if (as === "span") {
      return (
        <span
          className={finalClassName}
          ref={ref as React.Ref<HTMLSpanElement>}
          {...(props as React.HTMLAttributes<HTMLSpanElement>)}
        />
      );
    }
    if (as === "div") {
      return (
        <div
          className={finalClassName}
          ref={ref as React.Ref<HTMLDivElement>}
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
        />
      );
    }
    if (as === "label") {
      return (
        <label
          className={finalClassName}
          ref={ref as React.Ref<HTMLLabelElement>}
          {...(props as React.HTMLAttributes<HTMLLabelElement>)}
        />
      );
    }

    // Default to paragraph
    return <p className={finalClassName} ref={ref} {...props} />;
  }
);

Text.displayName = "Text";

export { Text };
