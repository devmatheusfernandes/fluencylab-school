"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StudentClass, ClassStatus } from "@/types/classes/class";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalIcon,
  ModalPrimaryButton,
  ModalSecondaryButton,
  ModalClose,
} from "@/components/ui/modal";
import { Card } from "@/components/ui/card";
import {
  RescheduleOption,
  useStudentClassActions,
} from "@/hooks/useStudentClassActions";
import { Text } from "../ui/text";
import { useTranslations, useLocale } from "next-intl";

interface ClassCancellationModalProps {
  classData: StudentClass;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ClassCancellationModal: React.FC<ClassCancellationModalProps> = ({
  classData,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const t = useTranslations("ClassCancellationModal");
  const locale = useLocale();

  const [step, setStep] = useState<
    "confirm" | "reschedule" | "options" | "success"
  >("reschedule");
  const [selectedSlot, setSelectedSlot] = useState<RescheduleOption | null>(
    null
  );
  const {
    loading,
    error,
    rescheduleOptions,
    checkRescheduleOptions,
    cancelClass,
    rescheduleClass,
  } = useStudentClassActions(classData.studentId);

  useEffect(() => {
    if (isOpen && step === "reschedule") {
      checkRescheduleOptions(classData.id);
    }
  }, [isOpen, step, classData.id, checkRescheduleOptions]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const handleCancel = async () => {
    const result = await cancelClass(classData.id);
    if (result.success) {
      setStep("success");
      setTimeout(() => {
        onConfirm();
        onClose();
      }, 2000);
    }
  };

  const handleReschedule = async () => {
    if (selectedSlot) {
      const newScheduledAt = new Date(selectedSlot.date);
      const [hours, minutes] = selectedSlot.time.split(":").map(Number);
      newScheduledAt.setHours(hours, minutes, 0, 0);

      const result = await rescheduleClass(
        classData.id,
        newScheduledAt,
        selectedSlot.slotId,
        "Reagendamento solicitado pelo aluno"
      );

      if (result.success) {
        setStep("success");
        setTimeout(() => {
          onConfirm();
          onClose();
        }, 2000);
      }
    }
  };

  const handleRescheduleChoice = (choice: "cancel" | "reschedule") => {
    if (choice === "cancel") {
      setStep("confirm");
    } else {
      setStep("options");
    }
  };

  const resetModal = () => {
    setStep("reschedule");
    setSelectedSlot(null);
    onClose();
  };

  return (
    <Modal open={isOpen} onOpenChange={resetModal}>
      <ModalContent>
        <AnimatePresence mode="wait">
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ModalHeader>
                <ModalIcon type="warning" />
                <ModalTitle className="text-center">
                  {t("confirmCancellationTitle")}
                </ModalTitle>
              </ModalHeader>

              <ModalBody>
                <Text variant="subtitle" size="sm" className="text-center mb-6">
                  {t("confirmCancellationDescription")}
                </Text>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="font-medium text-red-900 dark:text-red-100">
                    {classData.language}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {formatDate(classData.scheduledAt)}
                  </div>
                </div>
              </ModalBody>

              <ModalFooter>
                <ModalSecondaryButton onClick={() => setStep("reschedule")}>
                  {t("back")}
                </ModalSecondaryButton>
                <ModalPrimaryButton
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {loading ? t("canceling") : t("confirm")}
                </ModalPrimaryButton>
              </ModalFooter>
            </motion.div>
          )}

          {step === "reschedule" && (
            <motion.div
              key="reschedule"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ModalClose />
              <ModalHeader>
                <ModalIcon type="delete" />
                <ModalTitle className="text-center">{t("cancellationTitle")}</ModalTitle>
              </ModalHeader>

              <ModalBody>
                <Text variant="subtitle" size="sm" className="text-center mb-6">
                  {t("rescheduleSuggestion")}
                </Text>
                {classData.status === ClassStatus.CANCELED_TEACHER_MAKEUP && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800 text-center">
                      {t("teacherCancellationWarning")}
                    </p>
                  </div>
                )}
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    {classData.language}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {formatDate(classData.scheduledAt)}
                  </div>
                </div>
              </ModalBody>

              <ModalFooter>
                <ModalSecondaryButton
                  onClick={() => handleRescheduleChoice("cancel")}
                >
                  {t("cancelClass")}
                </ModalSecondaryButton>
                <ModalPrimaryButton
                  onClick={() => handleRescheduleChoice("reschedule")}
                >
                  {t("rescheduleClass")}
                </ModalPrimaryButton>
              </ModalFooter>
            </motion.div>
          )}

          {step === "options" && (
            <motion.div
              key="options"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ModalHeader>
                <ModalIcon type="calendar" />
                <ModalTitle>{t("chooseNewTime")}</ModalTitle>
                <ModalDescription>
                  {t("selectSlot")}
                </ModalDescription>
              </ModalHeader>

              <ModalBody>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                      <div className="text-red-700 dark:text-red-300 font-medium">
                        {t("errorLoadingOptions")}
                      </div>
                      <div className="text-red-600 dark:text-red-400 text-sm mt-1">
                        {error}
                      </div>
                    </div>
                  </div>
                ) : rescheduleOptions.length > 0 ? (
                  <div className="max-h-90 overflow-y-auto space-y-2 no-scrollbar">
                    {rescheduleOptions.map((option, index) => (
                      <Card
                        key={`${option.slotId}-${option.date.getTime()}-${index}`}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedSlot?.slotId === option.slotId &&
                          selectedSlot?.date.getTime() === option.date.getTime()
                            ? "!border-2 !border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
                        }`}
                        onClick={() => setSelectedSlot(option)}
                      >
                        <div className="p-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {formatDate(option.date)} às {option.time}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="text-gray-500 dark:text-gray-400 font-medium">
                        {t("noSlotsAvailable")}
                      </div>
                      <div className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                        {t("noRescheduleOptions")}
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <ModalSecondaryButton onClick={() => setStep("reschedule")}>
                  {t("back")}
                </ModalSecondaryButton>
                <ModalPrimaryButton
                  onClick={handleReschedule}
                  disabled={!selectedSlot || loading}
                >
                  {loading ? t("rescheduling") : t("confirmReschedule")}
                </ModalPrimaryButton>
              </ModalFooter>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <ModalHeader>
                <ModalIcon type="success" />
                <ModalTitle>{t("successTitle")}</ModalTitle>
                <ModalDescription>
                  {t("successDescription")}
                </ModalDescription>
              </ModalHeader>

              <ModalBody>
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="text-green-800 dark:text-green-200 font-medium">
                    {t("successOperation")}
                  </div>
                  <div className="text-green-700 dark:text-green-300 text-sm mt-1">
                    {t("redirecting")}
                  </div>
                </div>
              </ModalBody>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalContent>
    </Modal>
  );
};
