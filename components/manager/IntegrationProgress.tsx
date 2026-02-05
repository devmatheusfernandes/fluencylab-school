"use client";

import { StudentProfile } from "@/types/students/studentProfile";
import { FullUserDetails } from "@/types/users/userDetails";
import { Checkbox } from "@/components/ui/checkbox";
import { updateOnboardingStatus } from "@/actions/studentProfile";
import { useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface IntegrationProgressProps {
  profile: StudentProfile;
  user: FullUserDetails | null;
  hasPlacement?: boolean;
}

export default function IntegrationProgress({
  profile,
  user,
  hasPlacement = false,
}: IntegrationProgressProps) {
  const [isPending, startTransition] = useTransition();

  // Helper to handle manual updates
  const handleUpdate = (
    field: "accountCreated" | "roadmapCreated" | "lessonPlanCreated",
    checked: boolean,
  ) => {
    startTransition(async () => {
      const result = await updateOnboardingStatus(profile.id!, {
        [field]: checked,
      });

      if (result.success) {
        toast.success("Progresso atualizado");
      } else {
        toast.error("Erro ao atualizar progresso");
      }
    });
  };

  // Define steps
  const steps = [
    {
      id: "profile_created",
      label: "Perfil criado",
      checked: true, // Always true if we are here
      manual: false,
    },
    {
      id: "account_created",
      label: "Conta do aluno criada",
      checked:
        !!profile.studentId || !!profile.onboardingStatus?.accountCreated,
      manual: true,
      field: "accountCreated" as const,
      description: "Gerente marca este passo",
    },
    {
      id: "contract_signed",
      label: "Aluno assinou contrato",
      checked: !!user?.contractStartDate || !!(user as any)?.ContratosAssinados, // Check both just in case
      manual: false,
      description: "Verificação automática",
    },
    {
      id: "placement_test",
      label: "Aluno fez nivelamento",
      checked: hasPlacement || (!!profile.level && profile.level !== "Unknown"),
      manual: false,
      description: "Verificação automática",
    },
    {
      id: "plan_prompt",
      label: "Plano-prompt criado",
      checked: !!profile.generatedPromptPlan,
      manual: false,
      description: "Verificação automática",
    },
    {
      id: "teacher_schedule",
      label: "Professor e horário escolhido",
      checked: !!user?.scheduledClasses && user.scheduledClasses.length > 0,
      manual: false,
      description: "Verificação automática",
    },
    {
      id: "roadmap_created",
      label: "Criar roadmap do plano de aulas",
      checked: !!profile.roadmap,
      manual: false,
      field: "roadmapCreated" as const,
      description: "Verificação automática",
    },
    {
      id: "lesson_plan_created",
      label: "Plano de aula criado",
      checked: !!profile.onboardingStatus?.lessonPlanCreated,
      manual: true,
      field: "lessonPlanCreated" as const,
      description: "Placeholder",
    },
  ];

  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Progresso de Integração</h2>
        <div className="space-y-4">
          {steps.map((step) => {
            const isCompleted = step.checked;

            return (
              <div key={step.id} className="flex items-start gap-3">
                <div className="pt-0.5">
                  <Checkbox
                    id={step.id}
                    checked={step.checked}
                    onCheckedChange={(checked) =>
                      step.manual &&
                      handleUpdate(step.field!, checked as boolean)
                    }
                    disabled={!step.manual || isPending}
                    className={cn(
                      "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                      !step.manual && "opacity-50 cursor-not-allowed",
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor={step.id}
                    className={cn(
                      "text-sm font-medium leading-none",
                      isCompleted ? "text-foreground" : "text-muted-foreground",
                      !step.manual && "cursor-not-allowed",
                    )}
                  >
                    {step.label}
                  </label>
                  {step.description && (
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
