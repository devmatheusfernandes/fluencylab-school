"use client";

import React, { useState, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalPrimaryButton,
  ModalSecondaryButton,
} from "@/components/ui/modal";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

// Import step components
import {
  WelcomeStep,
  PlatformOverviewStep,
  BasicInfoStep,
  EmailVerificationStep,
  BestPracticesStep,
  ContractSelectionStep,
  ContractReviewStep,
  PaymentStep,
  FinishStep,
} from "./steps/student";
import { ProgressTracker } from "../ui/progress-tracker";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Types for onboarding data
export interface OnboardingData {
  // Basic Info
  nickname: string;
  interfaceLanguage: string;
  theme: "light" | "dark";
  themeColor?: "violet" | "rose" | "orange" | "yellow" | "green";

  // Email verification
  emailVerified: boolean;

  // Contract
  contractLengthMonths: 6 | 12;
  contractSigned: boolean;
  contractData?: any;

  // Payment
  paymentMethod: "pix" | null;
  paymentCompleted: boolean;
  subscriptionId?: string;
}

export interface OnboardingStepProps {
  data: OnboardingData;
  onDataChange: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = [
  { id: "welcome", title: "Bem-vindo", component: WelcomeStep },
  { id: "overview", title: "Visão Geral", component: PlatformOverviewStep },
  { id: "basic-info", title: "Informações Básicas", component: BasicInfoStep },
  {
    id: "email-verification",
    title: "Verificação de Email",
    component: EmailVerificationStep,
  },
  {
    id: "best-practices",
    title: "Boas Práticas",
    component: BestPracticesStep,
  },
  {
    id: "contract-selection",
    title: "Seleção de Contrato",
    component: ContractSelectionStep,
  },
  {
    id: "contract-review",
    title: "Revisão do Contrato",
    component: ContractReviewStep,
  },
  { id: "payment", title: "Pagamento", component: PaymentStep },
  { id: "finish", title: "Finalização", component: FinishStep },
];

// Dynamic button texts for each step
const BUTTON_TEXTS = {
  welcome: "Vamos começar!",
  overview: "Entendi! Vamos continuar",
  "basic-info": "Salvar e continuar",
  "email-verification": "Continuar para as boas práticas",
  "best-practices": "Entendi! Vamos escolher meu plano",
  "contract-selection": "Revisar contrato",
  "contract-review": "Aceitar e continuar",
  payment: "Finalizar cadastro",
  finish: "Continuar",
};

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const { data: session, update: updateSession } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    nickname: session?.user?.name || "",
    interfaceLanguage: "pt",
    theme: "light",
    themeColor: "violet",
    emailVerified: false,
    contractLengthMonths: 6,
    contractSigned: false,
    paymentMethod: null,
    paymentCompleted: false,
  });

  const handleDataChange = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const canGoNext = useCallback(() => {
    const step = STEPS[currentStep];
    switch (step.id) {
      case "welcome":
      case "overview":
        return true;
      case "basic-info":
        return data.nickname.trim().length > 0;
      case "email-verification":
        return data.emailVerified; // Require email verification
      case "best-practices":
        return true;
      case "contract-selection":
        return data.contractLengthMonths > 0;
      case "contract-review":
        return data.contractSigned;
      case "payment":
        return data.paymentCompleted;
      case "finish":
        return true;
      default:
        return true;
    }
  }, [currentStep, data]);

  const handleCompleteOnboarding = useCallback(async () => {
    try {
      setIsLoading(true);

      // Mark tutorial as completed
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      // Add a small delay to ensure session is fully updated
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success("Bem-vindo ao Fluency Lab!");
      onComplete();
    } catch (error) {
      toast.error("Erro ao finalizar o processo de integração.");
    } finally {
      setIsLoading(false);
    }
  }, [data, onComplete]);

  const handleNext = useCallback(async () => {
    if (!canGoNext()) {
      toast.error(
        "Por favor, complete as informações necessárias para continuar."
      );
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await handleCompleteOnboarding();
    }
  }, [currentStep, canGoNext, handleCompleteOnboarding]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Don't render if not open
  if (!isOpen) return null;
  const CurrentStepComponent = STEPS[currentStep].component;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <Modal open={isOpen}>
      <ModalContent
        className="max-w-6xl w-full onboarding-modal-enter max-h-[95vh] overflow-y-auto flex flex-col no-scrollbar"
        style={{ zIndex: 9999, position: "fixed" }}
      >
        {/* Header with progress */}
        <ModalHeader className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Primeiros passos
            </h2>
          </div>

          <ProgressTracker
            variant="steps"
            totalSteps={STEPS.length}
            currentStep={currentStep + 1}
            value={(currentStep + 1) * (100 / STEPS.length)}
            className="mb-2"
          />
        </ModalHeader>

        <CurrentStepComponent
          data={data}
          onDataChange={handleDataChange}
          onNext={handleNext}
          onBack={handleBack}
          isLoading={isLoading}
        />

        {/* Footer with navigation buttons */}
        <ModalFooter>
          {!isLastStep && (
            <ModalSecondaryButton
              onClick={handleBack}
              disabled={isFirstStep || isLoading}
              className="flex flex-row items-center gap-1"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </ModalSecondaryButton>
          )}

          <div className="flex gap-3">
            {!isLastStep && (
              <ModalPrimaryButton
                onClick={handleNext}
                disabled={!canGoNext() || isLoading}
                className="flex flex-row gap-1 items-center"
              >
                {BUTTON_TEXTS[
                  STEPS[currentStep].id as keyof typeof BUTTON_TEXTS
                ] || "Continuar"}{" "}
                <ArrowRight className="w-5 h-5" />
              </ModalPrimaryButton>
            )}

            {isLastStep && (
              <ModalPrimaryButton
                onClick={handleCompleteOnboarding}
                disabled={isLoading}
              >
                Finalizar
              </ModalPrimaryButton>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
