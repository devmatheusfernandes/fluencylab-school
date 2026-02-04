"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { StudentProfile } from "@/types/students/studentProfile";
import {
  createStudentProfile,
  updateStudentProfile,
} from "@/actions/studentProfile";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ArrowRight, Save, X } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalPrimaryButton,
  ModalSecondaryButton,
  ModalIcon,
} from "@/components/ui/modal";

// Steps Components (will be imported)
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { HistoryStep } from "./steps/HistoryStep";
import { ObjectivesStep } from "./steps/ObjectivesStep";
import { AvailabilityStep } from "./steps/AvailabilityStep";
import { ProfessionalStep } from "./steps/ProfessionalStep";
import { InterestsStep } from "./steps/InterestsStep";
import { LearningStyleStep } from "./steps/LearningStyleStep";
import { DifficultiesStep } from "./steps/DifficultiesStep";
import { PreferencesStep } from "./steps/PreferencesStep";
import { AdditionalStep } from "./steps/AdditionalStep";

interface StudentProfileSurveyProps {
  initialData?: StudentProfile;
  isEditing?: boolean;
}

const TOTAL_STEPS = 10;

export function StudentProfileSurvey({
  initialData,
  isEditing = false,
}: StudentProfileSurveyProps) {
  const t = useTranslations("StudentProfileSurvey");
  const router = useRouter();

  // Local Storage for Draft (only if not editing an existing one, or maybe even then?)
  // If editing, we want to start with initialData.
  const [draftData, setDraftData] = useLocalStorage<Partial<StudentProfile>>(
    "student-profile-draft",
    {},
  );

  const [formData, setFormData] = useState<Partial<StudentProfile>>(() => {
    if (isEditing && initialData) return initialData;
    return { ...draftData, ...initialData };
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Sync with LocalStorage
  useEffect(() => {
    if (!isEditing) {
      setDraftData(formData);
    }
  }, [formData, isEditing, setDraftData]);

  // Warn on unsaved changes when closing tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleCancel = () => {
    if (isDirty) {
      setIsCancelModalOpen(true);
    } else {
      router.push("/hub/manager/student-profiles");
    }
  };

  const confirmCancel = () => {
    setIsCancelModalOpen(false);
    if (!isEditing) setDraftData({});
    router.push("/hub/manager/student-profiles");
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.name) {
      toast.error("Nome é obrigatório (Etapa 1)");
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (isEditing && formData.id) {
        result = await updateStudentProfile(formData.id, formData);
      } else {
        result = await createStudentProfile(
          formData as Omit<StudentProfile, "id" | "createdAt" | "updatedAt">,
        );
      }

      if (result.success) {
        toast.success(
          isEditing ? "Perfil atualizado!" : "Perfil criado com sucesso!",
        );
        // Clear draft
        if (!isEditing) setDraftData({});
        router.push("/hub/manager/student-profiles");
      } else {
        toast.error("Erro ao salvar perfil: " + result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof StudentProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const updateNestedField = (
    parent: keyof StudentProfile,
    field: string,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...((prev[parent] as any) || {}),
        [field]: value,
      },
    }));
    setIsDirty(true);
  };

  const renderStep = () => {
    const commonProps = { formData, updateField, updateNestedField };

    switch (currentStep) {
      case 1:
        return <BasicInfoStep {...commonProps} />;
      case 2:
        return <HistoryStep {...commonProps} />;
      case 3:
        return <ObjectivesStep {...commonProps} />;
      case 4:
        return <AvailabilityStep {...commonProps} />;
      case 5:
        return <ProfessionalStep {...commonProps} />;
      case 6:
        return <InterestsStep {...commonProps} />;
      case 7:
        return <LearningStyleStep {...commonProps} />;
      case 8:
        return <DifficultiesStep {...commonProps} />;
      case 9:
        return <PreferencesStep {...commonProps} />;
      case 10:
        return <AdditionalStep {...commonProps} />;
      default:
        return null;
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="mx-auto w-full pb-20">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("header.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("header.step", { current: currentStep, total: TOTAL_STEPS })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              {t("header.cancel")}
            </Button>
            <Button
              variant="outline"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              {t("header.saveExit")}
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Content */}
      <Card className="border-none shadow-none bg-transparent sm:bg-card sm:shadow-sm sm:border">
        <CardContent className="p-0 sm:p-6">{renderStep()}</CardContent>
      </Card>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-10 sm:relative sm:border-none sm:bg-transparent sm:p-0 sm:mt-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("header.back")}
          </Button>

          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="w-full sm:w-auto min-w-[120px]"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : currentStep === TOTAL_STEPS ? (
              t("header.finish")
            ) : (
              <>
                {t("header.next")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <ModalContent showHandle={false}>
          <ModalIcon type="warning" />
          <ModalHeader showCloseButton={false}>
            <ModalTitle>{t("cancelModal.title")}</ModalTitle>
            <ModalDescription>{t("cancelModal.description")}</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalSecondaryButton onClick={() => setIsCancelModalOpen(false)}>
              {t("cancelModal.continue")}
            </ModalSecondaryButton>
            <ModalPrimaryButton variant="destructive" onClick={confirmCancel}>
              {t("cancelModal.exit")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
