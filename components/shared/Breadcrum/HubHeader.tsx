"use client";

import { usePathname } from "next/navigation";
import { generateBreadcrumbs } from "@/lib/ui/breadcrumb";
import Breadcrumb from "./index";
import { useSidebar } from "@/context/SidebarContext";
import { useMessages } from "next-intl";

export default function HubHeader() {
  const pathname = usePathname();
  const messages = useMessages();
  const breadcrumbItems = generateBreadcrumbs(pathname, messages as any);
  const { toggleSidebar } = useSidebar();
  return (
    <Breadcrumb
      items={breadcrumbItems}
      onToggleSidebar={toggleSidebar}
      className="pwa-header-sticky"
    />
  );
}
