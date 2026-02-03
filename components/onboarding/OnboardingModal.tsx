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
  BasicInfoStep,
  EmailVerificationStep,
  BestPracticesStep,
  ContractSelectionStep,
  ContractReviewStep,
  PaymentStep,
  FinishStep,
} from "./steps/student";
import { ProgressTracker } from "../ui/progress-tracker";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

// Types for onboarding data
export interface OnboardingData {
  nickname: string;
  interfaceLanguage: string;
  theme: "light" | "dark";
  themeColor?: "violet" | "rose" | "indigo" | "yellow" | "green";
  emailVerified: boolean;
  contractLengthMonths: 6 | 12;
  contractSigned: boolean;
  contractData?: any;
  paymentMethod: "pix" | null;
  paymentCompleted: boolean;
  subscriptionId?: string;
  cpf?: string;
  phoneNumber?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
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
  { id: "welcome", title: "Início", component: WelcomeStep },
  { id: "basic-info", title: "Perfil", component: BasicInfoStep },
  // { id: "email-verification", title: "Email", component: EmailVerificationStep },
  { id: "best-practices", title: "Regras", component: BestPracticesStep },
  {
    id: "contract-selection",
    title: "Plano",
    component: ContractSelectionStep,
  },
  { id: "contract-review", title: "Contrato", component: ContractReviewStep },
  { id: "payment", title: "Pagamento", component: PaymentStep },
  { id: "finish", title: "Conclusão", component: FinishStep },
];

const STUDENT_ONBOARDING_STORAGE_KEY = "fluencylab_student_onboarding_draft";

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // Controls when auto-save can start
  const [data, setData] = useState<OnboardingData>({
    nickname: session?.user?.name || "",
    interfaceLanguage: "pt",
    theme: "light",
    themeColor: "violet",
    emailVerified: false,
    contractLengthMonths: 12, // Default para o mais vantajoso
    contractSigned: false,
    paymentMethod: null,
    paymentCompleted: false,
  });

  // Load draft from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STUDENT_ONBOARDING_STORAGE_KEY);
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
    if (!isLoaded) return;

    const timeoutId = setTimeout(() => {
      localStorage.setItem(
        STUDENT_ONBOARDING_STORAGE_KEY,
        JSON.stringify({
          data,
          step: currentStep,
        }),
      );
    }, 500); // Debounce to avoid excessive writes

    return () => clearTimeout(timeoutId);
  }, [data, currentStep, isLoaded]);

  const handleDataChange = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const canGoNext = useCallback(() => {
    const step = STEPS[currentStep];
    switch (step.id) {
      case "welcome":
        return true;
      case "basic-info":
        return data.nickname.trim().length >= 2;
      // case "email-verification": return data.emailVerified;
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

  const getButtonText = () => {
    const stepId = STEPS[currentStep].id;

    if (stepId === "contract-review") {
      return data.contractSigned
        ? "Contrato assinado, continuar"
        : "Assinar para continuar";
    }

    if (stepId === "payment") {
      return data.paymentCompleted
        ? "Pagamento confirmado, continuar"
        : "Realizar pagamento";
    }

    if (currentStep === STEPS.length - 1) return "Ir para o Dashboard";

    const texts: Record<string, string> = {
      welcome: "Começar",
      "basic-info": "Salvar e Avançar",
      // "email-verification": "Email Verificado, Avançar",
      "best-practices": "Concordo e Continuar",
      "contract-selection": "Confirmar Plano",
    };
    return texts[stepId] || "Continuar";
  };

  const handleCompleteOnboarding = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Falha ao completar onboarding");

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Clear draft on success
      localStorage.removeItem(STUDENT_ONBOARDING_STORAGE_KEY);

      toast.success("Tudo pronto! Bem-vindo.");
      onComplete();
    } catch (error) {
      toast.error("Erro ao finalizar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [data, onComplete]);

  const handleNext = useCallback(async () => {
    if (!canGoNext()) {
      // Feedback visual simples se o usuário tentar avançar sem completar
      if (STEPS[currentStep].id === "contract-review")
        toast.error("Assine o contrato para continuar.");
      else if (STEPS[currentStep].id === "payment")
        toast.error("Realize o pagamento para continuar.");
      else toast.error("Complete esta etapa para continuar.");
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await handleCompleteOnboarding();
    }
  }, [currentStep, canGoNext, handleCompleteOnboarding]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  if (!isOpen) return null;
  const CurrentStepComponent = STEPS[currentStep].component;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  // Ocultar botão "Próximo" se a ação principal for dentro do componente (como assinar ou pagar)
  // E o usuário ainda não tiver completado a ação.
  // Porem, você pediu para o botão mostrar o status, então vamos mantê-lo visivel mas talvez desabilitado ou interativo
  const isActionStep = ["contract-review", "payment"].includes(
    STEPS[currentStep].id,
  );
  const stepCompleted = canGoNext();

  return (
    <Modal open={isOpen}>
      <ModalContent className="flex flex-col justify-around">
        <ModalHeader className="sticky top-0 z-10">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg md:text-xl font-bold">
              {STEPS[currentStep].title}
            </h2>
            <ProgressTracker
              variant="steps"
              totalSteps={STEPS.length}
              currentStep={currentStep + 1}
              value={(currentStep + 1) * (100 / STEPS.length)}
              className="h-1.5"
            />
          </div>
        </ModalHeader>

        <div className="overflow-y-auto mt-8 mb-3">
          <CurrentStepComponent
            data={data}
            onDataChange={handleDataChange}
            onNext={handleNext} // Passamos para auto-avanço opcional
            onBack={handleBack}
            isLoading={isLoading}
          />
        </div>

        <ModalFooter>
          {!isFirstStep && (
            <ModalSecondaryButton onClick={handleBack} disabled={isLoading}>
              <ArrowLeft className="w-4 h-4 md:mr-2" />
              <span>Voltar</span>
            </ModalSecondaryButton>
          )}

            <ModalPrimaryButton
              onClick={isLastStep ? handleCompleteOnboarding : handleNext}
              disabled={(!stepCompleted && !isActionStep) || isLoading}
              className={`${!stepCompleted && isActionStep ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoading ? "Processando..." : getButtonText()}
              {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
              {isLastStep && <Check className="w-4 h-4 ml-2" />}
            </ModalPrimaryButton>
          
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
