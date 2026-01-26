"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";
import { ClassStatus, StudentClass } from "@/types/classes/class";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NoResults } from "@/components/ui/no-results";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
  ModalPrimaryButton,
  ModalSecondaryButton,
  ModalIcon,
} from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Skeleton } from "../ui/skeleton";
import { FileUser } from "lucide-react";

interface ClassesCardProps {
  classes: StudentClass[];
  onUpdateClassStatus: (
    classId: string,
    newStatus: ClassStatus
  ) => Promise<void>;
  onUpdateClassFeedback?: (classId: string, feedback: string) => Promise<void>;
  onFetchClasses: (month: number, year: number) => Promise<void>;
  loading?: boolean;
}

export default function ClassesCard({
  classes,
  onUpdateClassStatus,
  onUpdateClassFeedback,
  onFetchClasses,
  loading = false,
}: ClassesCardProps) {
  const t = useTranslations("ClassesCard");
  const tMonths = useTranslations("Months");
  const locale = useLocale();

  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    classId: string | null;
    currentFeedback: string;
  }>({ open: false, classId: null, currentFeedback: "" });

  // Teacher confirmation modals
  const [teacherCancelModal, setTeacherCancelModal] = useState<{
    open: boolean;
    classId: string | null;
  }>({ open: false, classId: null });

  const [noShowModal, setNoShowModal] = useState<{
    open: boolean;
    classId: string | null;
  }>({ open: false, classId: null });

  // Enhanced month names for better UX
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

  // Filter classes by selected month and year
  const filteredClasses = classes.filter((cls) => {
    const classDate = new Date(cls.scheduledAt);
    return (
      classDate.getMonth() === selectedMonth &&
      classDate.getFullYear() === selectedYear
    );
  });

  // When month/year changes, fetch classes for that period
  useEffect(() => {
    onFetchClasses(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, onFetchClasses]);

  // Handle updating class status with optimistic updates
  const handleUpdateClassStatus = async (
    classId: string,
    newStatus: ClassStatus
  ) => {
    try {
      await onUpdateClassStatus(classId, newStatus);
      onFetchClasses(selectedMonth, selectedYear);
      console.log("Class status updated successfully.");
      toast.success(t("toastUpdated"));
    } catch (error) {
      console.error("Failed to update class status:", error);
      // Could add toast notification here
    }
  };

  // Handle updating class feedback
  const handleUpdateClassFeedback = async (
    classId: string,
    feedback: string
  ) => {
    try {
      // Check if onUpdateClassFeedback is defined before calling it
      if (onUpdateClassFeedback) {
        await onUpdateClassFeedback(classId, feedback);
      }
      onFetchClasses(selectedMonth, selectedYear);
      setFeedbackModal({ open: false, classId: null, currentFeedback: "" });
    } catch (err: any) {
      console.error("Failed to update feedback:", err);
    }
  };

  // Enhanced status configuration with modern styling
  const getStatusConfig = (status: ClassStatus | string) => {
    const norm = (typeof status === "string" ? status : (status as string))
      .toLowerCase()
      .replace(/_/g, "-");
    const statusMap: Record<
      string,
      {
        label: string;
        className: string;
        icon: string;
        selectClassName: string;
      }
    > = {
      [ClassStatus.SCHEDULED]: {
        label: t("teacherStatus.scheduled"),
        className:
          "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
        icon: "📅",
        selectClassName:
          "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
      },
      [ClassStatus.COMPLETED]: {
        label: t("teacherStatus.completed"),
        className:
          "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800",
        icon: "✅",
        selectClassName:
          "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800",
      },
      [ClassStatus.CANCELED_STUDENT]: {
        label: t("teacherStatus.canceledStudent"),
        className:
          "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
        icon: "❌",
        selectClassName:
          "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
      },
      [ClassStatus.CANCELED_TEACHER]: {
        label: t("teacherStatus.canceledTeacher"),
        className:
          "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
        icon: "❌",
        selectClassName:
          "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
      },
      [ClassStatus.CANCELED_ADMIN]: {
        label: t("teacherStatus.canceledAdmin"),
        className:
          "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
        icon: "🛡️",
        selectClassName:
          "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
      },
      [ClassStatus.CANCELED_TEACHER_MAKEUP]: {
        label: t("teacherStatus.canceledTeacherMakeup"),
        className:
          "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
        icon: "🔄",
        selectClassName:
          "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
      },
      [ClassStatus.CANCELED_CREDIT]: {
        label: t("teacherStatus.canceledCredit"),
        className:
          "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
        icon: "💳",
        selectClassName:
          "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
      },
      [ClassStatus.NO_SHOW]: {
        label: t("teacherStatus.noShow"),
        className:
          "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
        icon: "👤",
        selectClassName:
          "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
      },
      [ClassStatus.RESCHEDULED]: {
        label: t("teacherStatus.rescheduled"),
        className:
          "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800",
        icon: "📅",
        selectClassName:
          "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800",
      },
      [ClassStatus.TEACHER_VACATION]: {
        label: t("teacherStatus.teacherVacation"),
        className:
          "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
        icon: "🏖️",
        selectClassName:
          "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
      },
      [ClassStatus.OVERDUE]: {
        label: t("teacherStatus.overdue"),
        className:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
        icon: "⏰",
        selectClassName:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
      },
    };

    return (
      statusMap[norm] || statusMap[status as ClassStatus] || {
        label: t("teacherStatus.other"),
        className:
          "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/50 dark:text-gray-300 dark:border-gray-800",
        icon: "❓",
        selectClassName:
          "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/50 dark:text-gray-300 dark:border-gray-800",
      }
    );
  };

  // Teacher-specific status options (only the 3 main ones + current status if different)
  const getTeacherStatusOptions = (
    currentStatus: ClassStatus
  ): { value: ClassStatus; label: string }[] => {
    const mainOptions = [
      { value: ClassStatus.COMPLETED, label: t("teacherStatus.completed") },
      {
        value: ClassStatus.CANCELED_TEACHER_MAKEUP,
        label: t("teacherStatus.iCanceled"),
      },
      { value: ClassStatus.NO_SHOW, label: t("teacherStatus.noShow") },
    ];

    // If current status is not one of the main options, add it to the list
    const isMainOption = mainOptions.some(
      (option) => option.value === currentStatus
    );
    if (!isMainOption) {
      const currentStatusConfig = getStatusConfig(currentStatus);
      return [
        { value: currentStatus, label: currentStatusConfig.label },
        ...mainOptions,
      ];
    }

    return mainOptions;
  };

  // Handle status change with confirmation modals for teacher
  const handleStatusChange = (classId: string, newStatus: ClassStatus) => {
    if (newStatus === ClassStatus.CANCELED_TEACHER_MAKEUP) {
      setTeacherCancelModal({ open: true, classId });
      return;
    }
    if (newStatus === ClassStatus.NO_SHOW) {
      setNoShowModal({ open: true, classId });
      return;
    }

    // For completed status, update directly
    handleUpdateClassStatus(classId, newStatus);
  };

  return (
    <Card className="min-h-[60vh] lg:h-full">
      {/* Enhanced Feedback Modal - only for teachers */}
      {onUpdateClassFeedback && (
        <Modal
          open={feedbackModal.open}
          onOpenChange={(open) => {
            setFeedbackModal({ ...feedbackModal, open });
            if (!open) {
              setFeedbackModal({
                open: false,
                classId: null,
                currentFeedback: "",
              });
            }
          }}
        >
          <ModalContent className="max-w-2xl">
            <ModalHeader>
              <ModalIcon type="document" />
              <ModalTitle className="flex items-center gap-2">
                {t("reportModalTitle")}
              </ModalTitle>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t("reportModalDescription")}
                </p>
                <Textarea
                  value={feedbackModal.currentFeedback}
                  onChange={(e) =>
                    setFeedbackModal({
                      ...feedbackModal,
                      currentFeedback: e.target.value,
                    })
                  }
                  placeholder={t("reportPlaceholder")}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t("charsCount", { count: feedbackModal.currentFeedback.length })}
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="flex gap-3">
              <ModalSecondaryButton
                onClick={() =>
                  setFeedbackModal({ ...feedbackModal, open: false })
                }
              >
                {t("cancel")}
              </ModalSecondaryButton>
              <ModalPrimaryButton
                onClick={() => {
                  if (feedbackModal.classId) {
                    handleUpdateClassFeedback(
                      feedbackModal.classId,
                      feedbackModal.currentFeedback
                    );
                  }
                }}
              >
                {t("saveReport")}
              </ModalPrimaryButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Teacher Cancel Confirmation Modal */}
      <Modal
        open={teacherCancelModal.open}
        onOpenChange={(open) => {
          setTeacherCancelModal({ ...teacherCancelModal, open });
          if (!open) {
            setTeacherCancelModal({ open: false, classId: null });
          }
        }}
      >
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalIcon type="warning" />
            <ModalTitle className="flex items-center gap-2">
              {t("cancelModalTitle")}
            </ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {t("cancelModalDescription")}
            </p>
          </ModalBody>
          <ModalFooter className="flex gap-3">
            <ModalSecondaryButton
              onClick={() =>
                setTeacherCancelModal({ ...teacherCancelModal, open: false })
              }
            >
              {t("back")}
            </ModalSecondaryButton>
            <ModalPrimaryButton
              onClick={async () => {
                if (teacherCancelModal.classId) {
                  await handleUpdateClassStatus(
                    teacherCancelModal.classId,
                    ClassStatus.CANCELED_TEACHER_MAKEUP
                  );
                  setTeacherCancelModal({ open: false, classId: null });
                }
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {t("confirmCancel")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Teacher No Show Confirmation Modal */}
      <Modal
        open={noShowModal.open}
        onOpenChange={(open) => {
          setNoShowModal({ ...noShowModal, open });
          if (!open) {
            setNoShowModal({ open: false, classId: null });
          }
        }}
      >
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalIcon type="warning" />
            <ModalTitle className="flex items-center gap-2">
              {t("noShowModalTitle")}
            </ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {t("noShowModalDescription")}
            </p>
          </ModalBody>
          <ModalFooter className="flex gap-3">
            <ModalSecondaryButton
              onClick={() => setNoShowModal({ ...noShowModal, open: false })}
            >
              {t("back")}
            </ModalSecondaryButton>
            <ModalPrimaryButton
              onClick={async () => {
                if (noShowModal.classId) {
                  await handleUpdateClassStatus(
                    noShowModal.classId,
                    ClassStatus.NO_SHOW
                  );
                  setNoShowModal({ open: false, classId: null });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("confirmNoShow")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modern Header with Glass Effect */}
      <div className="border-b border-gray-200/50 dark:border-gray-700/50 py-2 mb-2">
        <Card className="flex flex-row w-full gap-4">
          <div className="space-y-1">
            <Text size="sm" variant="subtitle">
              {t("month")}
            </Text>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="h-10 lg:w-44 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                <SelectValue>{monthNames[selectedMonth]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1">
            <Text size="sm" variant="subtitle">
              {t("year")}
            </Text>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
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
        </Card>
      </div>

      {/* Enhanced Classes Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} />
            ))}
          </div>
        ) : filteredClasses.length > 0 ? (
          <div className="space-y-2">
            {filteredClasses.map((cls, index) => {
              const statusConfig = getStatusConfig(cls.status);
              // Ensure we have a proper Date object
              const classDate = new Date(cls.scheduledAt);
              const today = new Date();

              // Compare dates by setting time to 00:00:00 for accurate day comparison
              const classDateWithoutTime = new Date(classDate);
              classDateWithoutTime.setHours(0, 0, 0, 0);

              const todayWithoutTime = new Date(today);
              todayWithoutTime.setHours(0, 0, 0, 0);

              const isToday =
                classDateWithoutTime.getTime() === todayWithoutTime.getTime();
              const isPast = classDateWithoutTime < todayWithoutTime;
              const isFuture = classDateWithoutTime > todayWithoutTime;

              // Create a unique key that combines the class ID with its scheduled time and index
              // This ensures uniqueness even for rescheduled classes or classes with same ID
              const uniqueKey = `${cls.id}-${cls.scheduledAt}-${index}`;

              return (
                <div
                  key={uniqueKey}
                  className={`group relative overflow-hidden rounded-xl p-3 border transition-all duration-200 card-base ${
                    isToday
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : isPast
                        ? "border-gray-300 dark:border-gray-600 bg-gray-100/50 dark:bg-gray-800/50 opacity-80"
                        : "card-base"
                  } backdrop-blur-sm`}
                >
                  {isToday && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-indigo-600"></div>
                  )}
                  {isPast && !isToday && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary/35"></div>
                  )}

                  <div className="flex flex-col lg:flex-row lg:items-center">
                    {/* Date Section */}
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-1">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {classDate.toLocaleDateString(locale, {
                            weekday: "short",
                            day: "2-digit",
                          })}
                          {isToday && (
                            <span className="text-sm text-indigo-500 dark:text-indigo-400 ml-1">
                              • {t("today")}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <span className="mr-1">{t("at")}</span>
                          {classDate.toLocaleTimeString(locale, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex flex-row gap-2">
                      <>
                        <Select
                          value={cls.status}
                          onValueChange={(value) =>
                            handleStatusChange(cls.id, value as ClassStatus)
                          }
                          disabled={
                            isPast ||
                            [
                              ClassStatus.CANCELED_STUDENT,
                              ClassStatus.CANCELED_TEACHER,
                              ClassStatus.COMPLETED,
                              ClassStatus.RESCHEDULED,
                              ClassStatus.TEACHER_VACATION,
                              ClassStatus.CANCELED_ADMIN,
                            ].includes(cls.status)
                          }
                        >
                          <SelectTrigger
                            className={`w-full lg:w-34 h-10 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors ${
                              isPast ||
                              [
                                ClassStatus.CANCELED_STUDENT,
                                ClassStatus.CANCELED_TEACHER,
                                ClassStatus.COMPLETED,
                                ClassStatus.RESCHEDULED,
                                ClassStatus.TEACHER_VACATION,
                                ClassStatus.CANCELED_ADMIN,
                              ].includes(cls.status)
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            } ${getStatusConfig(cls.status).selectClassName}`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{statusConfig.icon}</span>
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {getTeacherStatusOptions(cls.status).map(
                              (option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  className={
                                    getStatusConfig(option.value)
                                      .selectClassName
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{option.label}</span>
                                  </div>
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>

                        <button
                          onClick={() => {
                            setFeedbackModal({
                              open: true,
                              classId: cls.id,
                              currentFeedback: cls.feedback || "",
                            });
                          }}
                          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                            cls.feedback
                              ? "bg-green-100 hover:bg-green-200 text-green-600 dark:bg-green-950/50 dark:hover:bg-green-900/50 dark:text-green-400"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-400"
                          }`}
                          title={
                            cls.feedback
                              ? t("editReport")
                              : t("addReport")
                          }
                        >
                          <FileUser
                            height={24}
                            className="w-6 h-6"
                          />
                        </button>
                      </>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-6xl mb-4">📚</div>
            <NoResults
              customMessage={{
                withoutSearch: t("noClassesFound", { month: monthNames[selectedMonth], year: selectedYear }),
              }}
              className="text-center"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t("tryOtherDate")}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
