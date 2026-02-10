"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils"; // Certifique-se de ter essa lib ou use twMerge
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalPrimaryButton,
  ModalSecondaryButton,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal"; // Ajuste o caminho para onde está seu arquivo base

// --- Interfaces ---

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ElementType; // Ícone Lucide
  content: React.ReactNode; // O conteúdo principal do passo
  // Estilização do Header
  headerBg?: string; // ex: "bg-blue-100"
  iconColor?: string; // ex: "text-blue-600"
}

interface WizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: WizardStep[];
  onComplete?: () => void;
  submitLabel?: string;
}

// --- Variantes de Animação ---

const contentVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 20 : -20,
    opacity: 0,
    filter: "blur(4px)",
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 20 : -20,
    opacity: 0,
    filter: "blur(4px)",
    position: "absolute",
  }),
};

// --- Componente Principal ---

export function WizardModal({
  open,
  onOpenChange,
  steps,
  onComplete,
  submitLabel = "Concluir",
}: WizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  // Resetar o wizard quando fechar
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setDirection(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete?.();
      onOpenChange(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const stepData = steps[currentStep];
  const Icon = stepData.icon;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {/* Removemos padding padrão para o header full-width */}
      <ModalContent className="p-0 overflow-hidden sm:max-w-[500px]">
        {/* --- Header Visual Animado --- */}
        <div
          className={cn(
            "h-32 w-full flex items-center justify-center relative transition-colors duration-500 ease-in-out rounded-md",
            stepData.headerBg || "bg-gray-100 dark:bg-gray-800",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "p-4 rounded-full bg-white dark:bg-background shadow-sm z-10",
                stepData.iconColor || "text-gray-900",
              )}
            >
              {Icon ? (
                <Icon className="w-8 h-8" />
              ) : (
                <div className="w-8 h-8" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* --- Corpo do Conteúdo --- */}
        <ModalBody className="px-6 pt-6 pb-2 relative min-h-[280px]">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={contentVariants as any}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="space-y-4 w-full"
            >
              {/* Títulos e Descrições */}
              <div className="text-center space-y-2 mb-6">
                <ModalTitle>{stepData.title}</ModalTitle>
                {stepData.description && (
                  <ModalDescription className="mx-auto max-w-sm">
                    {stepData.description}
                  </ModalDescription>
                )}
              </div>

              {/* Conteúdo Injetado via Props */}
              <div className="w-full">{stepData.content}</div>
            </motion.div>
          </AnimatePresence>
        </ModalBody>

        {/* --- Footer e Navegação --- */}
        <ModalFooter className="px-6 pb-6 pt-4 border-t-0 bg-white dark:bg-gray-900 z-10 relative flex-col gap-4">
          {/* Barra de Progresso */}
          <div className="flex w-full gap-1.5 justify-center mb-2">
            {steps.map((_, idx) => (
              <motion.div
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-colors duration-300",
                  idx === currentStep
                    ? "bg-primary"
                    : "bg-gray-200 dark:bg-gray-700",
                )}
                initial={false}
                animate={{
                  width: idx === currentStep ? 24 : 6,
                  backgroundColor: idx <= currentStep ? "var(--primary)" : "",
                }}
              />
            ))}
          </div>

          <div className="flex w-full items-center justify-between gap-3">
            <ModalSecondaryButton
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </ModalSecondaryButton>

            <ModalPrimaryButton onClick={handleNext} className="flex-1">
              {currentStep === steps.length - 1 ? (
                <>
                  {submitLabel} <Check className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Próximo <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </ModalPrimaryButton>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
