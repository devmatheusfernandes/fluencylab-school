"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Lock } from "lucide-react";

interface Step {
  id: number;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 1, label: "Conteúdo", description: "Escreva ou cole a aula" },
  { id: 2, label: "Análise", description: "Verificação de qualidade" },
  { id: 3, label: "Processamento", description: "Extração de itens" },
  { id: 4, label: "Componentes", description: "Revisão de vocabulário" },
  { id: 5, label: "Áudio", description: "Podcast e Transcrição" },
  { id: 6, label: "Transcrição", description: "Revisão do texto" },
  { id: 7, label: "Quiz", description: "Geração automática" },
  { id: 8, label: "Revisão Quiz", description: "Ajuste as perguntas" },
  { id: 9, label: "Publicação", description: "Finalize a aula" },
];

interface LessonCreationSidebarProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function LessonCreationSidebar({
  currentStep,
  onStepClick,
}: LessonCreationSidebarProps) {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <h3 className="font-semibold text-lg">Progresso da Aula</h3>
        <p className="text-sm text-muted-foreground">
          Passo {currentStep} de {STEPS.length}
        </p>
      </div>

      <div className="relative space-y-0">
        {/* Vertical Line */}
        <div className="absolute left-[15px] top-2 bottom-4 w-[2px] bg-muted -z-10" />

        {STEPS.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isLocked = step.id > currentStep;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-4 py-3 bg-background",
                !isLocked &&
                  onStepClick &&
                  "cursor-pointer hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors",
              )}
              onClick={() => {
                if (!isLocked && onStepClick) {
                  onStepClick(step.id);
                }
              }}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="w-8 h-8 text-primary fill-background" />
                ) : isCurrent ? (
                  <div className="relative">
                    <Circle className="w-8 h-8 text-primary fill-primary/10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {step.id}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Circle className="w-8 h-8 text-muted-foreground/30 fill-background" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {step.id}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <p
                  className={cn(
                    "text-sm font-medium leading-none",
                    isCurrent
                      ? "text-primary"
                      : isLocked
                        ? "text-muted-foreground"
                        : "text-foreground",
                  )}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
