"use client";

import { PopulatedStudentClass, ClassStatus } from "@/types/classes/class";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useState } from "react";
import RescheduleModal from "./RescheduleModal";
import { useTranslations, useLocale } from "next-intl";

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
  const t = useTranslations("StudentClassCard");
  const locale = useLocale();

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

    const confirmMessage = t("confirmCancel");
    if (!confirm(confirmMessage)) return;

    setIsCanceling(true);
    try {
      await onCancel(cls.id, new Date(cls.scheduledAt));
      toast.success(t("cancelSuccess"));
    } catch (error: any) {
      toast.error(error.message || t("cancelError"));
    } finally {
      setIsCanceling(false);
    }
  };

  const getStatusBadge = () => {
    // Tenta obter a tradução do status, fallback para o status original se não encontrar
    // Normaliza keys com underscore para hifen se necessário, mas o JSON tem ambos
    const statusKey = cls.status;
    const translatedStatus = t.has(`status.${statusKey}`) 
      ? t(`status.${statusKey}`) 
      : cls.status;
      
    const statusVariant = statusVariants[cls.status] || "default";
    return (
      <>
        <Badge variant={statusVariant}>{translatedStatus}</Badge>
        {cls.rescheduledFrom && (
          <Badge className="hidden capitalize">
            {cls.rescheduledFrom && t("status.rescheduled")}
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
                {new Date(cls.scheduledAt).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </p>
              <p className="text-sm text-subtitle">
                {new Date(cls.scheduledAt).toLocaleTimeString(locale === "pt" ? "pt-BR" : "en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {cls.rescheduledFrom && (
                <p className="text-xs text-blue-600 font-medium mt-1">
                  📅 {t("rescheduledBadge")}
                </p>
              )}
              {isTeacherMakeup && (
                <p className="text-center text-xs text-warning font-medium mt-1">
                  ⚠️ {t("teacherCanceledBadge")}
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
                {isCanceling ? t("canceling") : t("cancel")}
              </Button>
            )}
            {isReschedulable && (
              <Button
                size="sm"
                onClick={handleRescheduleClick}
                disabled={!isReschedulable}
                variant={isTeacherMakeup ? "success" : "primary"}
              >
                {isTeacherMakeup ? t("rescheduleCredit") : t("reschedule")}
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
