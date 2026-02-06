"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function BreadcrumbActions({
  children,
  placement = "end",
}: {
  children: React.ReactNode;
  placement?: "start" | "end";
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const portalId =
    placement === "start"
      ? "breadcrumb-mobile-start-actions"
      : "breadcrumb-mobile-actions";
  const portalRoot = document.getElementById(portalId);

  if (!portalRoot) return null;

  return createPortal(children, portalRoot);
}
