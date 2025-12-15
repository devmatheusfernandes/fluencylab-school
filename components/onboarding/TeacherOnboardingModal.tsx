// components/onboarding/TeacherOnboardingModal.tsx
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
import { ProgressTracker } from "@/components/ui/progress-tracker";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

// Import step components
import { WelcomeStep } from "./steps/student";

// Import teacher-specific steps
import { TeacherBasicInfoStep } from "./steps/teacher/TeacherBasicInfoStep";
import { TeacherEmailVerificationStep } from "./steps/teacher/TeacherEmailVerificationStep";
import { BankingInfoStep, BankingInfo } from "./steps/teacher/BankingInfoStep";
import {
  ScheduleSelectionStep,
  ScheduleSlot,
} from "./steps/teacher/ScheduleSelectionStep";

// Types for teacher onboarding data
export interface TeacherOnboardingData {
  // Basic Info
  nickname: string;
  interfaceLanguage: string;
  theme: "light" | "dark";

  // Email verification
  emailVerified: boolean;

  // Banking Information
  bankingInfo: BankingInfo;

  // Schedule
  scheduleSlots: ScheduleSlot[];

  // Completion
  onboardingCompleted: boolean;
}

export interface TeacherOnboardingStepProps {
  data: TeacherOnboardingData;
  onDataChange: (updates: Partial<TeacherOnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

// Wrapper components for steps that need data adaptation

const BankingInfoStepWrapper: React.FC<TeacherOnboardingStepProps> = (
  props
) => {
  return (
    <BankingInfoStep
      data={props.data.bankingInfo}
      onDataChange={(updates) =>
        props.onDataChange({
          bankingInfo: { ...props.data.bankingInfo, ...updates },
        })
      }
      onNext={props.onNext}
      onBack={props.onBack}
      isLoading={props.isLoading}
    />
  );
};

const ScheduleSelectionStepWrapper: React.FC<TeacherOnboardingStepProps> = (
  props
) => {
  return (
    <ScheduleSelectionStep
      data={props.data.scheduleSlots}
      onDataChange={(slots) => props.onDataChange({ scheduleSlots: slots })}
      onNext={props.onNext}
      onBack={props.onBack}
      isLoading={props.isLoading}
    />
  );
};

// Teacher-specific welcome step
const TeacherWelcomeStep: React.FC<TeacherOnboardingStepProps> = ({
  onNext,
}) => {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "Professor";

  return (
    <div className="flex-1 px-8 py-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">👨‍🏫</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Bem-vindo ao Fluency Lab, {firstName}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Estamos muito felizes em tê-lo como professor em nossa plataforma.
            Vamos configurar seu perfil para que você possa começar a ensinar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-3xl mb-3">🏦</div>
            <h3 className="font-semibold mb-2">Informações Bancárias</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure seus dados para receber pagamentos
            </p>
          </div>
          <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-semibold mb-2">Horários Regulares</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Defina sua disponibilidade semanal
            </p>
          </div>
          <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="font-semibold mb-2">Começar a Ensinar</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tudo pronto para suas primeiras aulas
            </p>
          </div>
        </div>

        <button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Vamos começar! 🎯
        </button>
      </div>
    </div>
  );
};

// Teacher finish step
const TeacherFinishStep: React.FC<TeacherOnboardingStepProps> = ({ data }) => {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "Professor";

  return (
    <div className="flex-1 px-8 py-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Parabéns, {firstName}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Seu perfil está configurado e você está pronto para começar a
            ensinar no Fluency Lab.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <h3 className="font-semibold mb-3 text-green-800 dark:text-green-200">
              ✅ Informações Bancárias
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              {data.bankingInfo.bankName} • Conta{" "}
              {data.bankingInfo.accountType === "checking"
                ? "Corrente"
                : "Poupança"}
            </p>
          </div>
          <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <h3 className="font-semibold mb-3 text-green-800 dark:text-green-200">
              ✅ Horários Configurados
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              {data.scheduleSlots.length} horários regulares definidos
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8">
          <h3 className="font-semibold mb-3">Próximos Passos</h3>
          <ul className="text-left space-y-2 max-w-md mx-auto">
            <li className="flex items-center gap-2">
              <span className="text-blue-600">•</span>
              Explore seu dashboard de professor
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">•</span>
              Aguarde a aprovação dos seus horários
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">•</span>
              Prepare-se para suas primeiras aulas
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

interface TeacherOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TEACHER_STEPS = [
  { id: "welcome", title: "Bem-vindo", component: TeacherWelcomeStep },
  {
    id: "basic-info",
    title: "Informações Básicas",
    component: TeacherBasicInfoStep,
  },
  {
    id: "email-verification",
    title: "Verificação de Email",
    component: TeacherEmailVerificationStep,
  },
  {
    id: "banking-info",
    title: "Informações Bancárias",
    component: BankingInfoStepWrapper,
  },
  {
    id: "schedule-selection",
    title: "Horários Regulares",
    component: ScheduleSelectionStepWrapper,
  },
  { id: "finish", title: "Finalização", component: TeacherFinishStep },
];

const TEACHER_BUTTON_TEXTS = {
  welcome: "Vamos começar!",
  "basic-info": "Salvar e continuar",
  "email-verification": "Continuar para informações bancárias",
  "banking-info": "Continuar para horários",
  "schedule-selection": "Finalizar configuração",
  finish: "Ir para o dashboard",
};

export const TeacherOnboardingModal: React.FC<TeacherOnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const { data: session, update: updateSession } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<TeacherOnboardingData>({
    nickname: session?.user?.name || "",
    interfaceLanguage: "pt",
    theme: "light",
    emailVerified: false,
    bankingInfo: {
      accountType: "checking",
      bankCode: "",
      bankName: "",
      agency: "",
      accountNumber: "",
      accountDigit: "",
      cpf: "",
      fullName: session?.user?.name || "",
    },
    scheduleSlots: [],
    onboardingCompleted: false,
  });

  const handleDataChange = useCallback(
    (updates: Partial<TeacherOnboardingData>) => {
      setData((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const canGoNext = useCallback(() => {
    const step = TEACHER_STEPS[currentStep];
    switch (step.id) {
      case "welcome":
        return true;
      case "basic-info":
        return data.nickname.trim().length > 0;
      case "email-verification":
        return data.emailVerified;
      case "banking-info":
        return (
          data.bankingInfo.fullName.trim() &&
          data.bankingInfo.cpf.trim() &&
          data.bankingInfo.bankCode &&
          data.bankingInfo.agency.trim() &&
          data.bankingInfo.accountNumber.trim() &&
          data.bankingInfo.accountType
        );
      case "schedule-selection":
        return data.scheduleSlots.length >= 5;
      case "finish":
        return true;
      default:
        return true;
    }
  }, [currentStep, data]);
  const handleCompleteOnboarding = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/onboarding/teacher/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to complete teacher onboarding");
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success(
        "Bem-vindo ao Fluency Lab! Seu perfil de professor foi configurado com sucesso."
      );
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

    if (currentStep < TEACHER_STEPS.length - 1) {
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

  if (!isOpen) return null;

  const CurrentStepComponent = TEACHER_STEPS[currentStep].component;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TEACHER_STEPS.length - 1;

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
              Configuração do Professor
            </h2>
          </div>

          <ProgressTracker
            variant="steps"
            totalSteps={TEACHER_STEPS.length}
            currentStep={currentStep + 1}
            value={(currentStep + 1) * (100 / TEACHER_STEPS.length)}
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
                className="flex flex-row items-center gap-1"
              >
                {
                  TEACHER_BUTTON_TEXTS[
                    TEACHER_STEPS[currentStep]
                      .id as keyof typeof TEACHER_BUTTON_TEXTS
                  ]
                }
                <ArrowRight className="w-5 h-5" />
              </ModalPrimaryButton>
            )}

            {isLastStep && (
              <ModalPrimaryButton
                onClick={handleNext}
                className="flex flex-row items-center gap-1"
              >
                {
                  TEACHER_BUTTON_TEXTS[
                    TEACHER_STEPS[currentStep]
                      .id as keyof typeof TEACHER_BUTTON_TEXTS
                  ]
                }
                <ArrowRight className="w-5 h-5" />
              </ModalPrimaryButton>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
