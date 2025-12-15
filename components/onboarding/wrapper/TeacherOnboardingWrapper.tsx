// components/onboarding/TeacherOnboardingWrapper.tsx
"use client";

import React from "react";
import { useTeacherOnboarding } from "@/hooks/useTeacherOnboarding";
import { TeacherOnboardingModal } from "../TeacherOnboardingModal";

interface TeacherOnboardingWrapperProps {
  children: React.ReactNode;
}

export const TeacherOnboardingWrapper: React.FC<TeacherOnboardingWrapperProps> = ({
  children,
}) => {
  const { shouldShowOnboarding, isLoading, completeOnboarding } = useTeacherOnboarding();

  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <TeacherOnboardingModal
        isOpen={shouldShowOnboarding}
        onClose={completeOnboarding}
        onComplete={completeOnboarding}
      />
    </>
  );
};