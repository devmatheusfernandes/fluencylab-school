
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { Progress } from "@/components/ui/progress";
import { Plan } from "@/types/financial/plan";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CheckCircle2, Lock } from "lucide-react";

interface PlanViewerProps {
  plan: Plan;
  totalScheduledClasses?: number;
}

export function PlanViewer({ plan, totalScheduledClasses }: PlanViewerProps) {
  const format = useFormatter();
  const locale = useLocale();
  const t = useTranslations("UserDetails.plan");

  const scheduledLessonsCount = plan.lessons.filter(l => l.scheduledClassId).length;
  const progressPercentage = totalScheduledClasses && totalScheduledClasses > 0 
    ? Math.min((scheduledLessonsCount / totalScheduledClasses) * 100, 100)
    : 0;

  const isPast = (dateStr?: string | Date) => {
    if (!dateStr) return false;
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return false;
    return date < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{plan.name}</h2>
          <Badge variant={plan.status === "active" ? "default" : "secondary"}>
            {plan.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Badge variant="outline">{plan.level}</Badge>
          <span>{plan.goal}</span>
        </div>
      </div>

      {totalScheduledClasses !== undefined && (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cobertura do Planejamento</span>
                <span className="font-medium">{scheduledLessonsCount} de {totalScheduledClasses} aulas planejadas</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
                {scheduledLessonsCount < totalScheduledClasses 
                    ? `Faltam ${totalScheduledClasses - scheduledLessonsCount} aulas para serem planejadas.` 
                    : "Todas as aulas agendadas possuem conteúdo definido."}
            </p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Cronograma de Aulas</h3>
        {plan.lessons.length > 0 ? (
          <div className="grid gap-3">
            {plan.lessons.map((lesson, index) => {
              const isLessonPast = isPast(lesson.scheduledDate);
              
              return (
                <Card 
                  key={lesson.id} 
                  className={cn(
                    "p-4 flex items-center justify-between transition-colors",
                    isLessonPast ? "bg-muted/40 border-muted" : "bg-card"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full font-medium",
                      isLessonPast ? "bg-primary/10 text-primary" : "bg-muted"
                    )}>
                      {isLessonPast ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                    </div>
                    <div>
                      <p className={cn(
                        "font-medium",
                        isLessonPast && "text-muted-foreground line-through decoration-border"
                      )}>
                        {lesson.title}
                        {isLessonPast && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground no-underline">
                            ({t("pastLesson")})
                          </span>
                        )}
                      </p>
                      {lesson.scheduledDate && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(lesson.scheduledDate).toLocaleDateString(locale, {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "numeric"
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  {lesson.scheduledClassId && !isLessonPast && (
                    <Badge variant="success" className="text-xs">
                      Agendada
                    </Badge>
                  )}
                  {isLessonPast && (
                     <Badge variant="outline" className="text-xs text-muted-foreground">
                       Concluída
                     </Badge>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Text>Nenhuma aula neste plano.</Text>
        )}
      </div>
    </div>
  );
}
