"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImmersionButtonTone = "primary" | "secondary";

type ImmersionButtonProps = Omit<ButtonProps, "size"> & {
  tone?: ImmersionButtonTone;
  size?: ButtonProps["size"];
};

export const ImmersionButton = forwardRef<
  HTMLButtonElement,
  ImmersionButtonProps
>(({ className, tone = "primary", variant, size = "lg", ...props }, ref) => {
  const resolvedVariant =
    variant ??
    (tone === "secondary" ? ("secondary" as const) : ("primary" as const));

  return (
    <Button
      ref={ref}
      size={size}
      variant={resolvedVariant}
      className={cn(
        "rounded-2xl font-bold transition-transform active:translate-y-[1px] disabled:active:translate-y-0",
        tone === "primary"
          ? "shadow-[0_6px_0_rgba(0,0,0,0.12)] active:shadow-[0_4px_0_rgba(0,0,0,0.12)]"
          : "shadow-[0_4px_0_rgba(0,0,0,0.10)] active:shadow-[0_3px_0_rgba(0,0,0,0.10)]",
        className
      )}
      {...props}
    />
  );
});

ImmersionButton.displayName = "ImmersionButton";
