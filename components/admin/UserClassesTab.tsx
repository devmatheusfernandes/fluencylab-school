"use client";

import { StudentClass, ClassStatus } from "@/types/classes/class";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslations, useLocale, useFormatter } from "next-intl";
import { useSession } from "next-auth/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalPrimaryButton,
} from "@/components/ui/modal";
import { Spinner } from "../ui/spinner";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Calendar1Icon, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserClassesTabProps {
  classes: StudentClass[];
}

interface Teacher {
  id: string;
  name: string;
  email?: string;
  role: string;
}

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 1; i <= currentYear + 2; i++) {
    years.push(i);
  }
  return years;
};

export default function UserClassesTab({
  classes: initialClasses,
}: UserClassesTabProps) {
  const router = useRouter();
  const tStatus = useTranslations("ClassStatus");
  const t = useTranslations("UserDetails.classes");
  const locale = useLocale();
  const format = useFormatter();
  const { data: session } = useSession();

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: format
        .dateTime(new Date(2024, i, 1), { month: "long" })
        .replace(/^\w/, (c) => c.toUpperCase()),
    }));
  }, [format]);

  const yearOptions = useMemo(() => generateYearOptions(), []);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [classes, setClasses] = useState<StudentClass[]>(initialClasses || []);

  // State for teacher confirmation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingTeacherUpdate, setPendingTeacherUpdate] = useState<{
    classId: string;
    teacherId: string;
    teacherName: string;
    currentTeacherName: string;
  } | null>(null);

  // State for status confirmation modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{
    classId: string;
    status: ClassStatus;
    currentStatus: ClassStatus;
  } | null>(null);

  // Fetch available teachers
  const fetchTeachers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/teachers");
      if (!response.ok) {
        throw new Error("Failed to fetch teachers");
      }
      const teacherList = await response.json();
      setTeachers(teacherList);
    } catch (error) {
      console.error("Erro ao buscar professores:", error);
      toast.error(t("toasts.loadError"));
    } finally {
      setLoadingTeachers(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Estados para controlar os filtros selecionados
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Filter classes based on selected month and year
  const filteredClasses = useMemo(() => {
    if (!classes) return [];

    return classes.filter((cls) => {
      const classDate = new Date(cls.scheduledAt);

      const monthMatch = classDate.getMonth() === selectedMonth;
      const yearMatch = classDate.getFullYear() === selectedYear;

      return monthMatch && yearMatch;
    });
  }, [classes, selectedMonth, selectedYear]);

  if (!classes || classes.length === 0) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <Calendar1Icon className="size-6" />
        </EmptyMedia>
        <EmptyContent>
          <EmptyHeader>
            <EmptyTitle>{t("noClassesScheduled")}</EmptyTitle>
          </EmptyHeader>
        </EmptyContent>
      </Empty>
    );
  }

  // Function to confirm and update class status
  const confirmUpdateClassStatus = async () => {
    if (!pendingStatusUpdate) return;

    const { classId, status } = pendingStatusUpdate;

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("toasts.updateFailed"));
      }

      toast.success(t("toasts.updateSuccess"));
      setIsStatusModalOpen(false);
      setPendingStatusUpdate(null);

      // Update the classes state
      setClasses((prevClasses) =>
        prevClasses.map((cls) => {
          if (cls.id === classId) {
            return { ...cls, status };
          }
          return cls;
        }),
      );
    } catch (error: any) {
      toast.error(`${t("toasts.updateError")} ${error.message}`);
      setIsStatusModalOpen(false);
      setPendingStatusUpdate(null);
    }
  };

  // Function to handle status change (opens confirmation modal)
  const handleStatusChange = (
    classId: string,
    newStatus: ClassStatus,
    currentStatus: ClassStatus,
  ) => {
    if (newStatus === currentStatus) return;

    setPendingStatusUpdate({
      classId,
      status: newStatus,
      currentStatus,
    });
    setIsStatusModalOpen(true);
  };

  // Function to confirm and update class teacher
  const confirmUpdateClassTeacher = async () => {
    if (!pendingTeacherUpdate) return;

    const { classId, teacherId } = pendingTeacherUpdate;
    // Handle the "none" case by setting teacherId to null
    const actualTeacherId = teacherId === "none" ? null : teacherId;

    try {
      const response = await fetch(`/api/classes/${classId}/teacher`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teacherId: actualTeacherId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("toasts.updateFailed"));
      }

      toast.success(t("toasts.updateSuccess"));
      setIsModalOpen(false);
      setPendingTeacherUpdate(null);

      // Update the classes state instead of reloading the page
      setClasses((prevClasses) =>
        prevClasses.map((cls) => {
          if (cls.id === classId) {
            // Create a new object with all properties
            const updatedClass = { ...cls };
            // Add or remove teacherId based on whether it's null
            if (actualTeacherId !== null) {
              updatedClass.teacherId = actualTeacherId;
            } else {
              delete updatedClass.teacherId;
            }
            return updatedClass;
          }
          return cls;
        }),
      );
    } catch (error: any) {
      toast.error(`${t("toasts.updateError")} ${error.message}`);
      setIsModalOpen(false);
      setPendingTeacherUpdate(null);
    }
  };

  // Function to handle teacher change (opens confirmation modal)
  const handleTeacherChange = (
    classId: string,
    teacherId: string,
    currentTeacherName: string,
  ) => {
    // Find the new teacher name
    let newTeacherName = t("noTeacher");
    if (teacherId !== "none") {
      const teacher = teachers.find((t) => t.id === teacherId);
      if (teacher) {
        newTeacherName = teacher.name;
      }
    }

    setPendingTeacherUpdate({
      classId,
      teacherId,
      teacherName: newTeacherName,
      currentTeacherName,
    });
    setIsModalOpen(true);
  };

  // Get status badge with appropriate styling
  const getStatusVariant = (status: ClassStatus) => {
    switch (status) {
      case ClassStatus.SCHEDULED:
        return "default";
      case ClassStatus.COMPLETED:
        return "success";
      case ClassStatus.CANCELED_TEACHER_MAKEUP:
        return "warning";
      case ClassStatus.RESCHEDULED:
        return "warning";
      case ClassStatus.NO_SHOW:
        return "warning";
      case ClassStatus.CANCELED_STUDENT:
      case ClassStatus.CANCELED_TEACHER:
      case ClassStatus.CANCELED_ADMIN:
      case ClassStatus.CANCELED_CREDIT:
        return "destructive";
      case ClassStatus.TEACHER_VACATION:
        return "secondary";
      case ClassStatus.OVERDUE:
        return "warning";

      default:
        return "destructive";
    }
  };

  const getStatusBadge = (cls: StudentClass) => {
    const key = String(cls.status).toLowerCase().replace(/_/g, "-");

    const availableStatuses = [
      ClassStatus.SCHEDULED,
      ClassStatus.COMPLETED,
      ClassStatus.CANCELED_STUDENT,
      ClassStatus.CANCELED_TEACHER,
      ClassStatus.CANCELED_TEACHER_MAKEUP,
      ClassStatus.CANCELED_ADMIN,
      ClassStatus.CANCELED_CREDIT,
      ClassStatus.NO_SHOW,
      ClassStatus.RESCHEDULED,
      ClassStatus.TEACHER_VACATION,
      ClassStatus.OVERDUE,
    ];

    return (
      <div className="flex flex-col items-end gap-2">
        <Select
          value={cls.status}
          onValueChange={(value) =>
            handleStatusChange(cls.id, value as ClassStatus, cls.status)
          }
        >
          <SelectTrigger
            className={cn(
              "w-[160px] h-8 text-xs font-semibold",
              getStatusVariant(cls.status) === "success" &&
                "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
              getStatusVariant(cls.status) === "warning" &&
                "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
              getStatusVariant(cls.status) === "destructive" &&
                "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
              getStatusVariant(cls.status) === "default" &&
                "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
              getStatusVariant(cls.status) === "secondary" &&
                "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800",
            )}
          >
            <SelectValue>{tStatus(key)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {tStatus(status.toLowerCase().replace(/_/g, "-"))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {cls.rescheduledFrom && (
          <Badge className="text-[10px] h-5">
            {tStatus("rescheduledBadge")}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* --- Teacher Confirmation Modal --- */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{t("modal.confirmTitle")}</ModalTitle>
            <ModalDescription>{t("modal.confirmDescription")}</ModalDescription>
          </ModalHeader>

          {pendingTeacherUpdate && (
            <div className="py-4 space-y-2">
              <p className="capitalize">
                <strong>{t("modal.currentTeacher")}</strong>{" "}
                {pendingTeacherUpdate.currentTeacherName}
              </p>
              <p className="capitalize">
                <strong>{t("modal.newTeacher")}</strong>{" "}
                {pendingTeacherUpdate.teacherName}
              </p>
            </div>
          )}

          <ModalFooter>
            <ModalPrimaryButton onClick={confirmUpdateClassTeacher}>
              {t("modal.confirm")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- Status Confirmation Modal --- */}
      <Modal open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{t("modal.confirmStatusTitle")}</ModalTitle>
            <ModalDescription>
              {t("modal.confirmStatusDescription")}
            </ModalDescription>
          </ModalHeader>

          {pendingStatusUpdate && (
            <div className="py-4 space-y-2">
              <p className="capitalize">
                <strong>{t("modal.currentStatus")}</strong>{" "}
                {tStatus(
                  String(pendingStatusUpdate.currentStatus)
                    .toLowerCase()
                    .replace(/_/g, "-"),
                )}
              </p>
              <p className="capitalize">
                <strong>{t("modal.newStatus")}</strong>{" "}
                {tStatus(
                  String(pendingStatusUpdate.status)
                    .toLowerCase()
                    .replace(/_/g, "-"),
                )}
              </p>
            </div>
          )}

          <ModalFooter>
            <ModalPrimaryButton onClick={confirmUpdateClassStatus}>
              {t("modal.confirm")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- Barra de Filtros --- */}
      <div className="flex flex-row gap-2">
        <Select
          value={String(selectedMonth)}
          onValueChange={(val) => setSelectedMonth(Number(val))}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t("filterByMonth")} />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((month) => (
              <SelectItem key={month.value} value={String(month.value)}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(selectedYear)}
          onValueChange={(val) => setSelectedYear(Number(val))}
        >
          <SelectTrigger className="w-full md:w-[120px]">
            <SelectValue placeholder={t("filterByYear")} />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredClasses.length > 0 ? (
          filteredClasses.map((cls, index) => {
            const classDate = new Date(cls.scheduledAt);
            const formattedDate = classDate.toLocaleDateString(locale, {
              weekday: "long",
              day: "2-digit",
              month: "long",
            });
            const formattedTime = classDate.toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Card
                key={`${cls.id}-${cls.scheduledAt}-${index}`}
                className="p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div>
                      <p className="subtitle-base">{formattedDate}</p>
                      <p className="text-sm paragraph-base">{formattedTime}</p>

                      {/* Display Plan and Lesson Info */}
                      {cls.planName && (
                        <div className="mt-2 text-sm text-primary font-medium">
                          <span className="text-xs text-muted-foreground block">
                            Plano:
                          </span>
                          {cls.planName}
                        </div>
                      )}
                      {cls.lessonTitle && (
                        <div className="mt-1 text-sm font-semibold">
                          <span className="text-xs text-muted-foreground block">
                            Lição:
                          </span>
                          {cls.lessonTitle}
                        </div>
                      )}

                      {cls.notes && (
                        <p className="text-sm mt-2 italic text-subtitle">
                          {cls.notes}
                        </p>
                      )}

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t("teacherLabel")}
                        </label>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={cls.teacherId || ""}
                            onValueChange={(value) =>
                              handleTeacherChange(
                                cls.id,
                                value,
                                cls.teacherId
                                  ? teachers.find((t) => t.id === cls.teacherId)
                                      ?.name || t("unknownTeacher")
                                  : t("noTeacher"),
                              )
                            }
                            disabled={loadingTeachers}
                          >
                            <SelectTrigger className="w-[200px] capitalize font-bold">
                              <SelectValue placeholder={t("selectTeacher")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem key="none" value="none">
                                {t("noTeacher")}
                              </SelectItem>
                              {teachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {loadingTeachers && <Spinner />}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(cls)}
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const isManager = session?.user?.role === "manager";
                      const basePath = isManager
                        ? "/hub/manager/class"
                        : "/hub/admin/class";
                      router.push(
                        `${basePath}/Aula?aula=${encodeURIComponent(cls.id)}`,
                      );
                    }}
                  >
                    {t("viewClass")}
                  </Button>
                </div>
              </Card>
            );
          })
        ) : (
          <Empty>
            <EmptyMedia variant="icon">
              <Video className="size-6" />
            </EmptyMedia>
            <EmptyContent>
              <EmptyHeader>
                <EmptyTitle>{t("noClassesFound")}</EmptyTitle>
              </EmptyHeader>
            </EmptyContent>
          </Empty>
        )}
      </div>
    </div>
  );
}
