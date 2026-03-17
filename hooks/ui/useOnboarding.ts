"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserRoles } from "@/types/users/userRoles";

export const useOnboarding = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isDismissed, setIsDismissed] = useState(false);

  const isChecking = status === "loading";

  const isStudent =
    session?.user?.role === UserRoles.STUDENT ||
    session?.user?.role === UserRoles.GUARDED_STUDENT;

  const needsTutorial = !session?.user?.tutorialCompleted;

  const showOnboarding =
    status === "authenticated" && isStudent && needsTutorial && !isDismissed;

  const handleOnboardingComplete = () => {
    setIsDismissed(true);
    router.push("/hub");
  };

  const handleOnboardingClose = () => {
    setIsDismissed(true);
  };

  return {
    showOnboarding,
    isChecking,
    handleOnboardingComplete,
    handleOnboardingClose,
  };
};
