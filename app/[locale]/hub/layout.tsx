"use client";

// React & Next.js
import { useEffect, useState, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useMessages } from "next-intl";
import { useSession } from "next-auth/react";

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
import { ChatClientProvider } from "@/context/ChatClientContext";

import { OnboardingWrapper } from "@/components/onboarding/wrapper/OnboardingWrapper";
import { TeacherOnboardingWrapper } from "@/components/onboarding/wrapper/TeacherOnboardingWrapper";

// StreamIO
import VideoHome from "@/components/stream/VideoHome";
import { useCreateChatClient } from "stream-chat-react";
import { OwnUserResponse, UserResponse } from "stream-chat";

function HubLayoutContent({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  const pathname = usePathname();
  const messages = useMessages();
  const locale = useLocale();

  // Stream Chat Logic
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
  const [unreadCount, setUnreadCount] = useState(0);

  const userData = useMemo(() => {
    return {
      id: session.user.id,
      name: session.user.name || session.user.email || "User",
      image: session.user.image || undefined,
    } as UserResponse;
  }, [session.user]);

  const tokenProvider = useCallback(async () => {
    if (!userData?.id) return "";
    try {
      const response = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData.id }),
      });
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error("Error fetching token:", error);
      return "";
    }
  }, [userData?.id]);

  const chatClient = useCreateChatClient({
    apiKey,
    userData,
    tokenOrProvider: tokenProvider,
  });

  useEffect(() => {
    if (!chatClient) return;

    const updateCount = () => {
      const user = chatClient.user as OwnUserResponse | undefined;
      setUnreadCount(user?.total_unread_count || 0);
    };

    updateCount();

    const handleEvent = () => {
      updateCount();
    };

    chatClient.on("notification.message_new", handleEvent);
    chatClient.on("notification.mark_read", handleEvent);
    chatClient.on("message.new", handleEvent);
    chatClient.on("message.read", handleEvent);
    chatClient.on("user.updated", handleEvent);

    return () => {
      chatClient.off("notification.message_new", handleEvent);
      chatClient.off("notification.mark_read", handleEvent);
      chatClient.off("message.new", handleEvent);
      chatClient.off("message.read", handleEvent);
      chatClient.off("user.updated", handleEvent);
    };
  }, [chatClient]);

  const VideoCallOverlay = () => {
    const { callData } = useCallContext();
    return callData?.callId ? <VideoHome /> : null;
  };

  const userRole = session?.user?.role || UserRoles.STUDENT;
  const rawItems = getSidebarItemsByRole(userRole, locale);

  const tSidebarItems = (messages?.SidebarItems ?? {}) as Record<
    string,
    string
  >;
  const items = rawItems.map((it) => ({
    ...it,
    label: it.labelKey ? (tSidebarItems[it.labelKey] ?? it.label) : it.label,
    badgeCount:
      it.labelKey === "chat" || it.label === "Chat" ? unreadCount : undefined,
  }));

  // Define o caminho base onde queremos esconder a sidebar e header
  const hideLayoutElements =
    (pathname?.startsWith(`/${locale}/hub/teacher/my-students/`) &&
      pathname?.includes("/notebook/")) ||
    (pathname?.startsWith(`/${locale}/hub/student/my-notebook/`) &&
      pathname?.includes("/notebook/")) ||
    pathname?.startsWith(`/${locale}/hub/student/my-practice`) ||
    pathname?.startsWith(`/${locale}/hub/student/my-courses/course/lesson`);

  const isChatPage =
    pathname?.includes("/my-chat") || pathname?.includes("/workbooks");

  // Se estivermos na página do caderno, não renderiza sidebar nem header
  if (hideLayoutElements) {
    return (
      <CallProvider>
        <ChatClientProvider client={chatClient}>
          <div className="flex flex-col min-h-screen bg-background">
            <Container className="p-0! flex-1 flex flex-col">
              {children}
              <VideoCallOverlay />
            </Container>
          </div>
        </ChatClientProvider>
      </CallProvider>
    );
  }

  // Layout padrão
  return (
    <OnboardingWrapper>
      <TeacherOnboardingWrapper>
        <CallProvider>
          <ChatClientProvider client={chatClient}>
            <SidebarProvider>
              <div className="flex flex-row gap-2 min-w-screen min-h-screen h-full p-0 sm:p-2 sidebar-base transition-colors duration-300 max-w-screen max-h-screen overflow-y-hidden">
                <SidebarWrapper items={items} />

                {/* Main content area */}
                <div className="flex-1 flex flex-col gap-[1.5px] overflow-x-hidden pb-14 md:pb-0">
                  {!pathname?.includes("/my-chat") && <HubHeader />}
                  <div
                    className={`flex container-base flex-1 flex-col sm:hidden ${
                      isChatPage ? "p-0" : "p-1"
                    }`}
                  >
                    {children}
                  </div>
                  <Container
                    className={`flex-1 flex-col hidden sm:flex ${
                      isChatPage ? "p-0 sm:p-0" : ""
                    }`}
                  >
                    {children}
                  </Container>
                </div>
              </div>
            </SidebarProvider>
          </ChatClientProvider>
        </CallProvider>
      </TeacherOnboardingWrapper>
    </OnboardingWrapper>
  );
}

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  if (loading) return null;

  if (!session) {
    return null;
  }

  return <HubLayoutContent session={session} children={children} />;
}
