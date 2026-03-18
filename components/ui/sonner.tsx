"use client";

import { useIsStandalone } from "@/hooks/ui/useIsStandalone";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();
  const isPWA = useIsStandalone();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={isPWA ? "bottom-center" : "top-center"}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        style: {
          background: "var(--primary)",
          color: "white",
          border: "1px solid var(--primary)",
          borderRadius: "var(--radius)",
        },
        classNames: {
          description: "!text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
