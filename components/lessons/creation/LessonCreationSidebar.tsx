"use client";

import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";

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
    <div className="w-full bg-card rounded-xl border shadow-sm p-6 space-y-6">
      <div className="space-y-1 pb-2 border-b">
        <h3 className="font-bold text-xl">Progresso</h3>
        <p className="text-sm text-muted-foreground">
          Etapa <span className="text-primary font-bold">{currentStep}</span> de{" "}
          {STEPS.length}
        </p>
      </div>

      <div className="relative pl-2">
        {/* Continuous Vertical Line */}
        <div
          className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-muted -z-10"
          aria-hidden="true"
        />

        <div className="space-y-6">
          {STEPS.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isLocked = step.id > currentStep;

            return (
              <div
                key={step.id}
                className={cn(
                  "group flex items-start gap-4 relative transition-all duration-200",
                  !isLocked && onStepClick && "cursor-pointer",
                )}
                onClick={() => {
                  if (!isLocked && onStepClick) {
                    onStepClick(step.id);
                  }
                }}
              >
                {/* Icon Container */}
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 transition-colors duration-300",
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCurrent
                        ? "bg-background border-primary text-primary ring-4 ring-primary/10"
                        : "bg-background border-muted text-muted-foreground",
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isLocked ? (
                    <span className="text-xs font-medium">{step.id}</span>
                  ) : (
                    <span className="text-xs font-bold">{step.id}</span>
                  )}
                </div>

                {/* Text Content */}
                <div
                  className={cn(
                    "pt-1 space-y-0.5 transition-opacity duration-200",
                    isLocked ? "opacity-60" : "opacity-100",
                  )}
                >
                  <p
                    className={cn(
                      "text-sm font-semibold leading-none",
                      isCurrent ? "text-primary" : "text-foreground",
                      !isLocked &&
                        !isCurrent &&
                        "group-hover:text-primary transition-colors",
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {step.description}
                  </p>
                </div>

                {/* Active Indicator on right (Mobile hidden usually, but nice touch) */}
                {isCurrent && (
                  <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full lg:hidden" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
