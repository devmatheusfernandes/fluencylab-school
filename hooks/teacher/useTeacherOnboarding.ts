// hooks/useTeacherOnboarding.ts
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export const useTeacherOnboarding = () => {
  const { data: session, status } = useSession();
  const [hasDismissedOnboarding, setHasDismissedOnboarding] = useState(false);

  // Derivando estado ao invés de usar useEffect
  const isTeacher = session?.user?.role === "teacher";
  const hasCompletedOnboarding = session?.user?.tutorialCompleted;
  const isLoading = status === "loading";

  const shouldShowOnboarding =
    !isLoading && isTeacher && !hasCompletedOnboarding && !hasDismissedOnboarding;

  const completeOnboarding = () => {
    setHasDismissedOnboarding(true);
  };

  return {
    shouldShowOnboarding,
    isLoading,
    completeOnboarding,
    isTeacher,
  };
};