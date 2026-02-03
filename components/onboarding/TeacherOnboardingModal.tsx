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
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

// Import teacher-specific steps
import { TeacherBasicInfoStep } from "./steps/teacher/TeacherBasicInfoStep";
import { BankingInfoStep } from "./steps/teacher/BankingInfoStep";
import { ScheduleSelectionStep } from "./steps/teacher/ScheduleSelectionStep";
import { TeacherContractStep } from "./steps/teacher/TeacherContractStep";
import { BankingInfo, ScheduleSlot } from "./steps/teacher";

// Types
export interface TeacherOnboardingData {
  nickname: string;
  interfaceLanguage: string;
  theme: "light" | "dark";
  emailVerified: boolean;
  bankingInfo: BankingInfo;
  contractSigned: boolean;
  scheduleSlots: ScheduleSlot[];
  onboardingCompleted: boolean;
}

export interface TeacherOnboardingStepProps {
  data: TeacherOnboardingData;
  onDataChange: (updates: Partial<TeacherOnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

// --- Wrappers para adaptar os dados aos componentes refatorados ---

const BankingInfoStepWrapper: React.FC<TeacherOnboardingStepProps> = (
  props,
) => (
  <BankingInfoStep
    data={props.data} // O componente BankingInfoStep refatorado espera o objeto data completo ou a prop específica?
    // Ajuste: No refator anterior, o BankingInfoStep recebia `data.bankingInfo` ou `data` completo dependendo da implementação.
    // Assumindo que o componente espera a estrutura completa para acessar data.bankingInfo:
    onDataChange={props.onDataChange}
    onNext={props.onNext}
    onBack={props.onBack}
    isLoading={props.isLoading}
  />
);

const ScheduleSelectionStepWrapper: React.FC<TeacherOnboardingStepProps> = (
  props,
) => (
  <ScheduleSelectionStep
    data={props.data}
    onDataChange={props.onDataChange}
    onNext={props.onNext}
    onBack={props.onBack}
    isLoading={props.isLoading}
  />
);

// --- Steps Inline Simplificados ---

const TeacherWelcomeStep: React.FC<TeacherOnboardingStepProps> = () => {
  const { data: session } = useSession();
  const t = useTranslations("Onboarding.Teacher.Welcome");
  const firstName = session?.user?.name?.split(" ")[0] || "Professor";

  return (
    <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-5xl md:text-6xl animate-bounce-slow">👨‍🏫</div>

        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {t("greeting", { name: firstName })}
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: t.raw("message") }} />

        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 text-sm text-blue-800 dark:text-blue-200">
          {t("note")}
        </div>
      </div>
    </div>
  );
};

const TeacherFinishStep: React.FC<TeacherOnboardingStepProps> = () => {
  const t = useTranslations("Onboarding.Teacher.Finish");

  return (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-20 h-20 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <Check className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-3xl font-bold mb-4">{t("title")}</h1>

      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-8">
        {t("description")}
      </p>

      <div className="text-sm text-gray-400">
        {t("dashboardNote")}
      </div>
    </div>
  );
};

// --- Modal Principal ---

interface TeacherOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TEACHER_STEPS = [
  { id: "welcome", component: TeacherWelcomeStep },
  { id: "basic-info", component: TeacherBasicInfoStep },
  // { id: "email-verification", component: TeacherEmailVerificationStep },
  { id: "banking-info", component: BankingInfoStepWrapper },
  { id: "contract-step", component: TeacherContractStep },
  {
    id: "schedule-selection",
    component: ScheduleSelectionStepWrapper,
  },
  { id: "finish", component: TeacherFinishStep },
];

const TEACHER_ONBOARDING_STORAGE_KEY = "fluencylab_teacher_onboarding_draft";

export const TeacherOnboardingModal: React.FC<TeacherOnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const { data: session } = useSession();
  const t = useTranslations("Onboarding");
  const tSteps = useTranslations("Onboarding.Steps");
  const tButtons = useTranslations("Onboarding.Buttons");
  const tToasts = useTranslations("Onboarding.Toasts");

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // Controls when auto-save can start
  const [data, setData] = useState<TeacherOnboardingData>({
    nickname: session?.user?.name || "",
    interfaceLanguage: "pt",
    theme: "light",
    emailVerified: false,
    bankingInfo: {
      paymentMethod: "account",
      accountType: "checking",
      bankCode: "",
      bankName: "",
      agency: "",
      accountNumber: "",
      accountDigit: "",
      cpf: "",
      fullName: session?.user?.name || "",
    },
    contractSigned: false,
    scheduleSlots: [],
    onboardingCompleted: false,
  });

  // Load draft from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(TEACHER_ONBOARDING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data) {
          setData((prev) => ({ ...prev, ...parsed.data }));
        }
        if (typeof parsed.step === "number") {
          setCurrentStep(parsed.step);
        }
      }
    } catch (error) {
      console.error("Failed to load onboarding draft:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save draft to localStorage whenever data or step changes
  React.useEffect(() => {
    if (!isLoaded || data.onboardingCompleted) return;

    const timeoutId = setTimeout(() => {
      localStorage.setItem(
        TEACHER_ONBOARDING_STORAGE_KEY,
        JSON.stringify({
          data,
          step: currentStep,
        }),
      );
    }, 500); // Debounce to avoid excessive writes

    return () => clearTimeout(timeoutId);
  }, [data, currentStep, isLoaded]);

  const handleDataChange = useCallback(
    (updates: Partial<TeacherOnboardingData>) => {
      setData((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  const canGoNext = useCallback(() => {
    const step = TEACHER_STEPS[currentStep];
    switch (step.id) {
      case "welcome":
        return true;
      case "basic-info":
        return data.nickname.trim().length > 0;
      // case "email-verification": return data.emailVerified;
      case "banking-info":
        const {
          fullName,
          cpf,
          paymentMethod,
          bankCode,
          agency,
          accountNumber,
          pixKey,
          pixKeyType,
        } = data.bankingInfo;
        const isCommonValid = !!(fullName && cpf);

        if (!isCommonValid) return false;

        if (paymentMethod === "pix") {
          return !!(pixKey && pixKeyType);
        }

        // Validation for Account
        return !!(bankCode && agency && accountNumber);
      case "contract-step":
        return data.contractSigned;
      case "schedule-selection":
        return data.scheduleSlots.length > 0;
      case "finish":
        return true;
      default:
        return true;
    }
  }, [currentStep, data]);

  // Lógica dinâmica do botão
  const getButtonText = () => {
    const stepId = TEACHER_STEPS[currentStep].id;

    if (stepId === "contract-step") {
      return data.contractSigned
        ? tButtons("signedContinue")
        : tButtons("signContinue");
    }

    if (currentStep === TEACHER_STEPS.length - 1) return tButtons("dashboard");

    const texts: Record<string, string> = {
      welcome: tButtons("start"),
      "basic-info": tButtons("continue"), // Changed to "continue" as "Próximo" might not be in generic buttons, or "continue" is fine
      // "email-verification": "Email Verificado",
      "banking-info": tButtons("saveData"),
      "schedule-selection": tButtons("confirmSchedule"),
    };
    return texts[stepId] || tButtons("continue");
  };

  const handleCompleteOnboarding = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/onboarding/teacher/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Erro ao salvar");

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Clear draft on success
      localStorage.removeItem(TEACHER_ONBOARDING_STORAGE_KEY);

      toast.success(tToasts("welcome"));
      onComplete();
    } catch {
      toast.error(tToasts("errorFinish"));
    } finally {
      setIsLoading(false);
    }
  }, [data, onComplete, tToasts]);

  const handleNext = useCallback(async () => {
    if (!canGoNext()) {
      if (TEACHER_STEPS[currentStep].id === "contract-step") {
        toast.error(tToasts("signContract"));
      } else {
        toast.error(tToasts("fillRequired"));
      }
      return;
    }

    if (currentStep < TEACHER_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await handleCompleteOnboarding();
    }
  }, [currentStep, canGoNext, handleCompleteOnboarding, tToasts]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  if (!isOpen) return null;

  const CurrentStepComponent = TEACHER_STEPS[currentStep].component;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TEACHER_STEPS.length - 1;
  const isActionStep = ["contract-step"].includes(
    TEACHER_STEPS[currentStep].id,
  );
  const stepCompleted = canGoNext();

  // Mapping step IDs to translation keys
  const getStepTitle = (stepId: string) => {
    const map: Record<string, string> = {
      "welcome": "welcome",
      "basic-info": "profile",
      "banking-info": "banking",
      "contract-step": "contract",
      "schedule-selection": "schedule",
      "finish": "finish"
    };
    return tSteps(map[stepId] || "welcome"); // fallback
  };

  return (
    <Modal open={isOpen}>
      <ModalContent className="flex flex-col justify-around">
        <ModalHeader className="sticky top-0 z-10">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg md:text-xl font-bold">
              {getStepTitle(TEACHER_STEPS[currentStep].id)}
            </h2>
            <ProgressTracker
              variant="steps"
              totalSteps={TEACHER_STEPS.length}
              currentStep={currentStep + 1}
              value={(currentStep + 1) * (100 / TEACHER_STEPS.length)}
              className="h-1.5"
            />
          </div>
        </ModalHeader>

        <div className="overflow-y-auto mt-8 mb-3">
          <CurrentStepComponent
            data={data}
            onDataChange={handleDataChange}
            onNext={handleNext}
            onBack={handleBack}
            isLoading={isLoading}
          />
        </div>

        <ModalFooter>
          {!isFirstStep && (
            <ModalSecondaryButton
              onClick={handleBack}
              disabled={isLoading}
              className="px-3"
            >
              <ArrowLeft className="w-4 h-4 md:mr-2" />
              <span>{tButtons("back")}</span>
            </ModalSecondaryButton>
          )}

          <div>
            <ModalPrimaryButton
              onClick={isLastStep ? handleCompleteOnboarding : handleNext}
              disabled={(!stepCompleted && !isActionStep) || isLoading}
              className={`${!stepCompleted && isActionStep ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoading ? tButtons("processing") : getButtonText()}
              {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
              {isLastStep && <Check className="w-4 h-4 ml-2" />}
            </ModalPrimaryButton>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
