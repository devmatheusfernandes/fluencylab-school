// hooks/useTeacherOnboarding.ts
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export const useTeacherOnboarding = () => {
  const { data: session, status } = useSession();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    // Check if user is a teacher and hasn't completed onboarding
    const isTeacher = session.user.role === "teacher";
    const hasCompletedOnboarding = session.user.tutorialCompleted;

    if (isTeacher && !hasCompletedOnboarding) {
      setShouldShowOnboarding(true);
    }

    setIsLoading(false);
  }, [session, status]);

  const completeOnboarding = () => {
    setShouldShowOnboarding(false);
  };

  return {
    shouldShowOnboarding,
    isLoading,
    completeOnboarding,
    isTeacher: session?.user?.role === "teacher",
  };
};