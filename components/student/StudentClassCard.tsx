"use client";
import { PopulatedStudentClass, ClassStatus } from "@/types/classes/class";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useState } from "react";
import RescheduleModal from "./RescheduleModal";

// Mapeamento de status para português
const statusTranslations: Record<string, string> = {
  scheduled: "Agendada",
  completed: "Concluída",
  canceled: "Cancelada",
  "no-show": "Faltou",
  no_show: "Faltou",
  "canceled-teacher": "Cancelada pelo Professor",
  canceled_teacher: "Cancelada pelo Professor",
  "canceled-student": "Cancelada pelo Aluno",
  canceled_student: "Cancelada pelo Aluno",
  "canceled-teacher-makeup": "À marcar reposição",
  canceled_teacher_makeup: "À marcar reposição",
  "canceled-admin": "Cancelada",
  canceled_admin: "Cancelada",
  cancelled: "Cancelada",
  rescheduled: "Reagendada",
};

// Mapeamento de status para cores dos badges
const statusVariants: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "destructive" | "info"
> = {
  scheduled: "default",
  completed: "success",
  canceled: "destructive",
  "no-show": "warning",
  no_show: "warning",
  "canceled-teacher": "destructive",
  canceled_teacher: "destructive",
  "canceled-student": "destructive",
  canceled_student: "destructive",
  "canceled-teacher-makeup": "warning",
  canceled_teacher_makeup: "warning",
  "canceled-admin": "destructive",
  canceled_admin: "destructive",
  cancelled: "destructive",
  rescheduled: "info",
};

export default function StudentClassCard({
  cls,
  canReschedule,
  onCancel,
  onReschedule,
  onCancelWithCheck,
}: {
  cls: PopulatedStudentClass;
  canReschedule: boolean;
  onCancel?: (classId: string, scheduledAt?: Date) => Promise<void>;
  onReschedule?: (cls: PopulatedStudentClass) => void;
  onCancelWithCheck?: (cls: PopulatedStudentClass) => void;
}) {
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const isReschedulable =
    (cls.status === ClassStatus.SCHEDULED ||
      cls.status === ClassStatus.NO_SHOW ||
      cls.status === ClassStatus.CANCELED_TEACHER_MAKEUP) &&
    canReschedule;

  const isCancelable = cls.status === ClassStatus.SCHEDULED;

  const isTeacherMakeup = cls.status === ClassStatus.CANCELED_TEACHER_MAKEUP;

  const isOverdue =
    cls.status === ClassStatus.SCHEDULED &&
    new Date(cls.scheduledAt) < new Date(new Date().setHours(0, 0, 0, 0));

  const handleRescheduleClick = () => {
    if (onReschedule) {
      onReschedule(cls);
    } else {
      setIsRescheduleModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsRescheduleModalOpen(false);
  };

  const handleCancelClick = async () => {
    if (onCancelWithCheck) {
      onCancelWithCheck(cls);
      return;
    }

    if (!onCancel) return;

    const confirmMessage =
      "Tem certeza que deseja cancelar esta aula? Esta ação não pode ser desfeita.";
    if (!confirm(confirmMessage)) return;

    setIsCanceling(true);
    try {
      await onCancel(cls.id, new Date(cls.scheduledAt));
      toast.success("Aula cancelada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar aula");
    } finally {
      setIsCanceling(false);
    }
  };

  const getStatusBadge = () => {
    const translatedStatus = statusTranslations[cls.status] || cls.status;
    const statusVariant = statusVariants[cls.status] || "default";
    return (
      <>
        <Badge variant={statusVariant}>{translatedStatus}</Badge>
        {cls.rescheduledFrom && (
          <Badge className="hidden capitalize">
            {cls.rescheduledFrom && "Reagendada"}
          </Badge>
        )}
      </>
    );
  };

  return (
    <>
      <Card className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start space-x-4">
            <Avatar>
              <AvatarImage src={cls.teacherAvatarUrl} />
              <AvatarFallback>{cls.teacherName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-lg capitalize">
                {cls.teacherName}
              </h3>
              <p className="text-sm font-semibold text-subtitle">
                {new Date(cls.scheduledAt).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </p>
              <p className="text-sm text-subtitle">
                {new Date(cls.scheduledAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {cls.rescheduledFrom && (
                <p className="text-xs text-blue-600 font-medium mt-1">
                  📅 Aula foi reagendada
                </p>
              )}
              {isTeacherMakeup && (
                <p className="text-center text-xs text-warning font-medium mt-1">
                  ⚠️ Cancelada pelo professor
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">{getStatusBadge()}</div>
        </div>

        {!isOverdue && (
          <div className="flex justify-center sm:justify-end gap-2">
            {isCancelable && onCancel && (
              <Button
                size="sm"
                variant="warning"
                onClick={handleCancelClick}
                disabled={isCanceling}
              >
                {isCanceling ? "Cancelando..." : "Cancelar"}
              </Button>
            )}
            {isReschedulable && (
              <Button
                size="sm"
                onClick={handleRescheduleClick}
                disabled={!isReschedulable}
                variant={isTeacherMakeup ? "success" : "primary"}
              >
                {isTeacherMakeup ? "Reagendar com crédito" : "Reagendar"}
              </Button>
            )}
          </div>
        )}
      </Card>

      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={handleCloseModal}
        classToReschedule={cls}
      />
    </>
  );
}
