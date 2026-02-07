"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { Plan } from "@/types/learning/plan";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { CalendarDays, BookOpen, Plus, Edit } from "lucide-react";
import { NoResults } from "@/components/ui/no-results";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalTrigger } from "@/components/ui/modal";
import { PlanEditor } from "@/components/plans/PlanEditor";
import { createPlan, updatePlan } from "@/actions/planActions";
import { toast } from "sonner";

interface PlanCalendarCardProps {
  plan: Plan | null;
  loading?: boolean;
  studentId: string;
  onRefresh: () => Promise<void>;
}

export default function PlanCalendarCard({
  plan,
  loading = false,
  studentId,
  onRefresh,
}: PlanCalendarCardProps) {
  const t = useTranslations("PlanCalendarCard");
  const tMonths = useTranslations("Months");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth(),
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  const monthNames = [
    tMonths("january"),
    tMonths("february"),
    tMonths("march"),
    tMonths("april"),
    tMonths("may"),
    tMonths("june"),
    tMonths("july"),
    tMonths("august"),
    tMonths("september"),
    tMonths("october"),
    tMonths("november"),
    tMonths("december"),
  ];

  const handleSavePlan = async (planData: Partial<Plan>) => {
    try {
      if (plan) {
        // Update existing plan
        const result = await updatePlan(plan.id, planData);
        if (!result.success) throw new Error(result.error);
        toast.success("Plano atualizado com sucesso!");
      } else {
        // Create new plan
        const result = await createPlan({
          ...planData,
          studentId,
          type: "student",
          status: "active",
        });
        if (!result.success) throw new Error(result.error);
        toast.success("Plano criado com sucesso!");
      }

      await onRefresh();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao salvar plano");
    }
  };

  if (loading) {
    return (
      <Card className="p-4 flex-1 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    );
  }

  // Common Dialog Content
  const EditorDialog = () => (
    <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <PlanEditor
        mode={plan ? "edit" : "create"}
        type="student"
        studentId={studentId}
        initialPlan={plan || undefined}
        onSave={handleSavePlan}
        onCancel={() => setIsModalOpen(false)}
      />
    </ModalContent>
  );

  if (!plan) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[300px] relative w-ful">
        <div className="absolute top-4 right-4">
          <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
            <ModalTrigger asChild>
              <Button size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </ModalTrigger>
            <EditorDialog />
          </Modal>
        </div>
        <BookOpen className="w-10 h-10 text-muted-foreground/50" />
        <Text className="text-muted-foreground">{t("noPlan")}</Text>
        <Button variant="outline" onClick={() => setIsModalOpen(true)}>
          Criar Plano
        </Button>
      </Card>
    );
  }

  const filteredLessons = plan.lessons
    .filter((lesson) => {
      if (!lesson.scheduledDate) return false;
      const lessonDate = new Date(lesson.scheduledDate);
      return (
        lessonDate.getMonth() === selectedMonth &&
        lessonDate.getFullYear() === selectedYear
      );
    })
    .sort((a, b) => {
      if (!a.scheduledDate || !b.scheduledDate) return 0;
      return (
        new Date(a.scheduledDate!).getTime() -
        new Date(b.scheduledDate!).getTime()
      );
    });

  return (
    <Card className="p-4 flex-1 flex flex-col gap-4 min-h-[400px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <Text className="font-semibold">
            {t("title")} - {plan.name}
          </Text>
        </div>
        <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
          <ModalTrigger asChild>
            <Button size="icon" variant="ghost">
              <Edit className="w-4 h-4" />
            </Button>
          </ModalTrigger>
          <EditorDialog />
        </Modal>
      </div>

      <div className="flex gap-2">
        <Select
          value={selectedMonth.toString()}
          onValueChange={(val) => setSelectedMonth(parseInt(val))}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthNames.map((month, index) => (
              <SelectItem key={index} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedYear.toString()}
          onValueChange={(val) => setSelectedYear(parseInt(val))}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
        {filteredLessons.length === 0 ? (
          <NoResults />
        ) : (
          filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors flex flex-col gap-1"
            >
              <div className="flex justify-between items-start">
                <Text className="font-medium text-sm">
                  {t("lesson", { order: lesson.order, title: lesson.title })}
                </Text>
                {lesson.scheduledDate && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full whitespace-nowrap">
                    {format(new Date(lesson.scheduledDate), "dd 'de' MMM", {
                      locale: dateLocale,
                    })}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
