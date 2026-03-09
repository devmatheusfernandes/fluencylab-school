"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Menu } from "lucide-react";
import { STEPS } from "./constants";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface LessonCreationSidebarProps {
  currentStep: number;
  maxCompletedStep?: number;
  onStepClick?: (step: number) => void;
}

export function LessonCreationSidebar({
  currentStep,
  maxCompletedStep,
  onStepClick,
}: LessonCreationSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const effectiveMaxStep =
    maxCompletedStep !== undefined ? maxCompletedStep : currentStep;

  const StepsList = () => (
    <div className="space-y-6">
      {STEPS.map((step) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const isLocked = step.id > effectiveMaxStep;

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
                setIsOpen(false);
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

            {/* Active Indicator on right (Desktop only) */}
            {isCurrent && (
              <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full hidden lg:block" />
            )}
          </div>
        );
      })}
    </div>
  );

  const currentStepInfo = STEPS.find((s) => s.id === currentStep);

  return (
    <>
      {/* Mobile View */}
      <div className="lg:hidden w-full mb-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between h-auto py-4 border-dashed"
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
              <div className="flex flex-col items-start text-left ml-4">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Etapa {currentStep} de {STEPS.length}
                </span>
                <span className="font-bold text-lg">
                  {currentStepInfo?.label || "Carregando..."}
                </span>
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetHeader className="mb-6 text-left">
              <SheetTitle>Progresso da Aula</SheetTitle>
            </SheetHeader>
            <div className="relative pl-6">
              <div
                className="absolute left-[39px] top-2 bottom-2 w-[2px] bg-muted -z-10"
                aria-hidden="true"
              />
              <StepsList />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block w-full bg-card rounded-xl border shadow-sm p-6 space-y-6 sticky top-8">
        <div className="space-y-1 pb-2 border-b">
          <h3 className="font-bold text-xl">Progresso</h3>
          <p className="text-sm text-muted-foreground">
            Etapa <span className="text-primary font-bold">{currentStep}</span>{" "}
            de {STEPS.length}
          </p>
        </div>

        <div className="relative pl-2">
          {/* Continuous Vertical Line */}
          <div
            className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-muted -z-10"
            aria-hidden="true"
          />
          <StepsList />
        </div>
      </div>
    </>
  );
}
