"use client";

// React & Next.js
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useMessages } from "next-intl";

// Types & Config
import { UserRoles } from "@/types/users/userRoles";
import { getSidebarItemsByRole } from "@/config/sidebarItems";

// Components
import HubHeader from "@/components/shared/Breadcrum/HubHeader";
import SidebarWrapper from "@/components/shared/Sidebar/SidebarWrapper";
import { Container } from "@/components/ui/container";

// Contexts
import { SidebarProvider } from "@/context/SidebarContext";
import { CallProvider, useCallContext } from "@/context/CallContext";

import { OnboardingWrapper } from "@/components/onboarding/wrapper/OnboardingWrapper";
import { TeacherOnboardingWrapper } from "@/components/onboarding/wrapper/TeacherOnboardingWrapper";

// StreamIO
import VideoHome from "@/components/stream/VideoHome";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const messages = useMessages();
  const locale = useLocale();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const VideoCallOverlay = () => {
    const { callData } = useCallContext();
    return callData?.callId ? <VideoHome /> : null;
  };

  useEffect(() => {
    async function fetchSession() {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setSession(data);
      setLoading(false);
    }
    fetchSession();
  }, []);

  if (loading) return null;

  const userRole = session?.user?.role || UserRoles.STUDENT;
  const rawItems = getSidebarItemsByRole(userRole, locale);

  const tSidebarItems = (messages?.SidebarItems ?? {}) as Record<
    string,
    string
  >;
  const items = rawItems.map((it) => ({
    ...it,
    label: it.labelKey ? (tSidebarItems[it.labelKey] ?? it.label) : it.label,
  }));

  // Define o caminho base onde queremos esconder a sidebar e header
  const hideLayoutElements =
    (pathname?.startsWith(`/${locale}/hub/teacher/my-students/`) &&
      pathname?.includes("/notebook/")) ||
    (pathname?.startsWith(`/${locale}/hub/student/my-notebook/`) &&
      pathname?.includes("/notebook/"));

  // Se estivermos na página do caderno, não renderiza sidebar nem header
  if (hideLayoutElements) {
    return (
      <CallProvider>
        <div className="flex flex-col min-h-screen bg-background">
          <Container className="p-0! flex-1 flex flex-col">
            {children}
            <VideoCallOverlay />
          </Container>
        </div>
      </CallProvider>
    );
  }

  // Layout padrão

  return (
    <OnboardingWrapper>
      <TeacherOnboardingWrapper>
        <CallProvider>
          <SidebarProvider>
            <div className="flex flex-row gap-2 min-w-screen min-h-screen h-full p-0 sm:p-2 sidebar-base transition-colors duration-300 max-w-screen max-h-screen overflow-y-hidden">
              <SidebarWrapper items={items} />

              {/* Main content area */}
              <div className="flex-1 flex flex-col gap-[1.5px] overflow-x-hidden pb-14 md:pb-0">
                <div className="sticky top-0 z-20">
                  <HubHeader />
                </div>
                <div className="flex bg-white/20 dark:bg-slate-900 flex-1 flex-col sm:hidden p-1">
                  {children}
                </div>
                <Container className="flex-1 flex-col hidden sm:flex">
                  {children}
                </Container>
              </div>
            </div>
          </SidebarProvider>
        </CallProvider>
      </TeacherOnboardingWrapper>
    </OnboardingWrapper>
  );
}
