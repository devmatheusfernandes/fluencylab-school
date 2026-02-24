// hooks/useOnboarding.ts
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserRoles } from "@/types/users/userRoles";

export const useOnboarding = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false); // Default to false
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Only check onboarding status for authenticated regular students
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setIsChecking(false);
      return;
    }

    // console.log("🔍 useOnboarding - Session check:", {
    //   status,
    //   userId: session?.user?.id,
    //   role: session?.user?.role,
    //   tutorialCompleted: session?.user?.tutorialCompleted,
    //   sessionUser: session?.user
    // });

    // Check if user is a regular student OR guarded student AND hasn't completed onboarding.
    if (
      (session?.user?.role === UserRoles.STUDENT || session?.user?.role === UserRoles.GUARDED_STUDENT) &&
      !session?.user?.tutorialCompleted
    ) {
      // Show onboarding for new students who haven't completed tutorial
      //console.log("✅ Showing onboarding modal for user - tutorialCompleted:", session?.user?.tutorialCompleted);
      setShowOnboarding(true);
    } else {
      // console.log("❌ NOT showing onboarding modal - tutorialCompleted:", session?.user?.tutorialCompleted, "role:", session?.user?.role);
      setShowOnboarding(false);
    }

    setIsChecking(false);
  }, [session, status]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Redirect to dashboard after onboarding completion
    router.push("/hub");
  };

  const handleOnboardingClose = () => {
    // Only allow closing if not in critical steps
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    isChecking,
    handleOnboardingComplete,
    handleOnboardingClose,
  };
};
