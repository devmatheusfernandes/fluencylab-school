// components/student/ClassCancellationModal.tsx
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

interface ClassCancellationModalProps {
  classData: StudentClass;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export const ClassCancellationModal: React.FC<ClassCancellationModalProps> = ({
  classData,
  isOpen,
  onClose,
  onConfirm,
}) => {
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
                  Confirmar Cancelamento
                </ModalTitle>
              </ModalHeader>

              <ModalBody>
                <Text variant="subtitle" size="sm" className="text-center mb-6">
                  Tem certeza que deseja cancelar esta aula? Esta ação não pode
                  ser desfeita.
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
                  Voltar
                </ModalSecondaryButton>
                <ModalPrimaryButton
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {loading ? "Cancelando..." : "Confirmar Cancelamento"}
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
                <ModalTitle className="text-center">Cancelamento</ModalTitle>
              </ModalHeader>

              <ModalBody>
                <Text variant="subtitle" size="sm" className="text-center mb-6">
                  Você tem opções de reagendamento disponíveis! Em vez de
                  cancelar, você pode reagendar esta aula.
                </Text>
                {classData.status === ClassStatus.CANCELED_TEACHER_MAKEUP && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800 text-center">
                      <span className="font-bold">Aviso:</span> Esta aula foi
                      cancelada pelo professor. Você pode reagendá-la usando um
                      crédito de reposição sem consumir seus reagendamentos
                      mensais.
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
                  Cancelar Aula
                </ModalSecondaryButton>
                <ModalPrimaryButton
                  onClick={() => handleRescheduleChoice("reschedule")}
                >
                  Reagendar Aula
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
                <ModalTitle>Escolha um Novo Horário</ModalTitle>
                <ModalDescription>
                  Selecione um dos horários disponíveis para reagendar sua aula
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
                        Erro ao carregar opções
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
                        Nenhum horário disponível
                      </div>
                      <div className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                        Não há opções de reagendamento no momento
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <ModalSecondaryButton onClick={() => setStep("reschedule")}>
                  Voltar
                </ModalSecondaryButton>
                <ModalPrimaryButton
                  onClick={handleReschedule}
                  disabled={!selectedSlot || loading}
                >
                  {loading ? "Reagendando..." : "Confirmar Reagendamento"}
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
                <ModalTitle>Sucesso!</ModalTitle>
                <ModalDescription>
                  Sua aula foi atualizada com sucesso.
                </ModalDescription>
              </ModalHeader>

              <ModalBody>
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="text-green-800 dark:text-green-200 font-medium">
                    Operação realizada com sucesso!
                  </div>
                  <div className="text-green-700 dark:text-green-300 text-sm mt-1">
                    Redirecionando...
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