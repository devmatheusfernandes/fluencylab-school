"use client";

import { usePathname } from "next/navigation";
import { generateBreadcrumbs } from "@/lib/breadcrumb";
import Breadcrumb from "./index";
import { useSidebar } from "@/context/SidebarContext";

export default function HubHeader() {
  const pathname = usePathname();
  const breadcrumbItems = generateBreadcrumbs(pathname);
  const { toggleSidebar } = useSidebar();
  return <Breadcrumb items={breadcrumbItems} onToggleSidebar={toggleSidebar} />;
}
