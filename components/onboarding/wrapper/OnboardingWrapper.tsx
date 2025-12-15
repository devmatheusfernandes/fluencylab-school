// components/onboarding/OnboardingWrapper.tsx
"use client";

import React from "react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingModal } from "../OnboardingModal";
import { Spinner } from "../../ui/spinner";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({
  children,
}) => {
  const {
    showOnboarding,
    isChecking,
    handleOnboardingComplete,
    handleOnboardingClose,
  } = useOnboarding();

  // Show loading while checking onboarding status
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
      />

      {children}
    </>
  );
};
