"use client";

import { useEffect, useState, useMemo } from "react";
import { useStudent } from "@/hooks/useStudent";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";
import { Header } from "@/components/ui/header";
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

import { StudentClass } from "@/types/classes/class";
import { NoResults } from "@/components/ui/no-results";

import StudentClassCard from "@/components/student/StudentClassCard";
import { ClassCancellationModal } from "@/components/student/ClassCancellationModal";
import RescheduleModal from "@/components/student/RescheduleModal";
import { Clock } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";

export default function StudentClassesComponent() {
  const t = useTranslations("StudentClassesComponent");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? "pt-BR" : "en-US";

  // Helper functions for date filtering
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: new Date(0, i + 1, 0).toLocaleString(dateLocale, {
          month: "long",
        }),
      })),
    [dateLocale],
  );

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const {
    myClasses,
    rescheduleInfo,
    isLoading,
    fetchMyClasses,
    checkRescheduleStatus,
    getUserMonthlyReschedules,
  } = useStudent();

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState<number | "all">(
    new Date().getMonth(),
  );
  const [selectedYear, setSelectedYear] = useState<number | "all">(
    new Date().getFullYear(),
  );
  const [monthlyRescheduleData, setMonthlyRescheduleData] = useState<{
    month: string;
    count: number;
    limit: number;
  } | null>(null);
  const [teacherCancellationCredits, setTeacherCancellationCredits] =
    useState<number>(0);

  // Modal states
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [classToCancel, setClassToCancel] = useState<StudentClass | null>(null);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [classToReschedule, setClassToReschedule] =
    useState<StudentClass | null>(null);
  const [showRescheduleConfirmModal, setShowRescheduleConfirmModal] =
    useState(false);

  useEffect(() => {
    fetchMyClasses();
    checkRescheduleStatus();
    fetchTeacherCancellationCredits();
  }, [fetchMyClasses, checkRescheduleStatus]);

  // Fetch teacher cancellation credits
  const fetchTeacherCancellationCredits = async () => {
    try {
      const response = await fetch("/api/student/credits/balance");
      if (response.ok) {
        const data = await response.json();
        setTeacherCancellationCredits(data.teacherCancellationCredits || 0);
      }
    } catch (error) {
      console.error("Error fetching teacher cancellation credits:", error);
    }
  };

  // Update monthly reschedule data when month/year changes
  useEffect(() => {
    if (
      getUserMonthlyReschedules &&
      selectedMonth !== "all" &&
      selectedYear !== "all"
    ) {
      const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
      getUserMonthlyReschedules(monthStr).then((data) => {
        setMonthlyRescheduleData(data);
      });
    } else {
      setMonthlyRescheduleData(null);
    }
  }, [selectedMonth, selectedYear, getUserMonthlyReschedules]);

  // Filter classes based on selected month and year
  const filteredClasses = useMemo(() => {
    if (!myClasses) return [];

    return myClasses.filter((cls) => {
      const classDate = new Date(cls.scheduledAt);

      const monthMatch =
        selectedMonth === "all" || classDate.getMonth() === selectedMonth;
      const yearMatch =
        selectedYear === "all" || classDate.getFullYear() === selectedYear;

      return monthMatch && yearMatch;
    });
  }, [myClasses, selectedMonth, selectedYear]);

  // Get reschedule info to display
  const displayRescheduleInfo = monthlyRescheduleData || rescheduleInfo;
  const isCurrentMonth =
    selectedMonth === new Date().getMonth() &&
    selectedYear === new Date().getFullYear();

  // Handle class cancellation with reschedule suggestion
  const handleCancelClass = async (classId: string, scheduledAt?: Date) => {
    try {
      const requestBody: { classId: string; scheduledAt?: string } = {
        classId,
      };
      if (scheduledAt) {
        requestBody.scheduledAt = scheduledAt.toISOString();
      }

      const response = await fetch("/api/student/classes/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("cancelError"));
      }

      if (result.success) {
        if (result.suggestReschedule) {
          // Show reschedule suggestion
          toast.info(
            t("rescheduleSuggestion", {
              remaining: result.rescheduleInfo.remaining,
            }),
            {
              duration: 8000,
              action: {
                label: "OK",
                onClick: () => {},
              },
            },
          );
        } else {
          toast.success(t("cancelSuccess"));
        }

        // Refresh the classes list and reschedule info
        await fetchMyClasses();
        await checkRescheduleStatus();
        await fetchTeacherCancellationCredits(); // Refresh credits after cancellation
      }
    } catch (error: any) {
      throw error; // Re-throw to be handled by the component
    }
  };

  // Handle reschedule click with verification
  const handleRescheduleClick = (cls: StudentClass) => {
    // Check if student can reschedule before showing modal
    if (rescheduleInfo.allowed || cls.status === "canceled-teacher-makeup") {
      setClassToReschedule(cls);
      setIsRescheduleModalOpen(true);
    } else {
      // Show modal asking if they want to cancel instead
      setClassToCancel(cls);
      setShowRescheduleConfirmModal(true);
    }
  };

  // Handle cancel with reschedule check
  const handleCancelWithRescheduleCheck = (cls: StudentClass) => {
    if (rescheduleInfo.allowed) {
      // Show modal suggesting reschedule first
      setClassToCancel(cls);
      setShowRescheduleConfirmModal(true);
    } else {
      // Direct cancellation
      setClassToCancel(cls);
      setShowCancellationModal(true);
    }
  };

  // Animação container
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const,
        staggerChildren: 0.1,
      },
    },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="p-4 md:p-6 space-y-6"
    >
      <Header
        heading={t("headerTitle")}
        subheading={t("headerSubtitle")}
        className="mb-3"
      />
      {/* Modals */}
      {classToCancel && (
        <ClassCancellationModal
          classData={classToCancel}
          isOpen={showCancellationModal}
          onClose={() => {
            setShowCancellationModal(false);
            setClassToCancel(null);
          }}
          onConfirm={() => {
            // Refresh classes after cancellation
            fetchMyClasses();
            checkRescheduleStatus();
            fetchTeacherCancellationCredits();
          }}
        />
      )}

      {/* Reschedule Modal */}
      {classToReschedule && (
        <RescheduleModal
          isOpen={isRescheduleModalOpen}
          onClose={() => {
            setIsRescheduleModalOpen(false);
            setClassToReschedule(null);
            fetchTeacherCancellationCredits();
          }}
          classToReschedule={classToReschedule}
        />
      )}

      {/* Reschedule Confirmation Modal */}
      {classToCancel && (
        <Modal
          open={showRescheduleConfirmModal}
          onOpenChange={(open) => {
            setShowRescheduleConfirmModal(open);
            if (!open) {
              setClassToCancel(null);
            }
          }}
        >
          <ModalContent>
            <ModalHeader>
              <ModalIcon>
                <Clock className="w-6 h-6 text-blue-600" />
              </ModalIcon>
              <ModalTitle>{t("rescheduleInsteadTitle")}</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <Text className="text-center my-4">
                {t("rescheduleInsteadDesc")}
              </Text>
              <div className="my-4 p-3 bg-blue-50 dark:bg-primary rounded-lg">
                <Text
                  size="sm"
                  className="text-center font-medium text-blue-900 dark:text-white"
                >
                  {t("availableReschedules", {
                    count: rescheduleInfo.limit - rescheduleInfo.count,
                    limit: rescheduleInfo.limit,
                  })}
                </Text>
              </div>
            </ModalBody>
            <ModalFooter>
              <ModalSecondaryButton
                onClick={() => {
                  setShowRescheduleConfirmModal(false);
                  setShowCancellationModal(true);
                }}
              >
                {t("cancelAnyway")}
              </ModalSecondaryButton>
              <ModalPrimaryButton
                onClick={() => {
                  setShowRescheduleConfirmModal(false);
                  setClassToReschedule(classToCancel);
                  setIsRescheduleModalOpen(true);
                  setClassToCancel(null);
                }}
              >
                {t("reschedule")}
              </ModalPrimaryButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Filter Controls */}
      <div className="w-full flex flex-col sm:flex-row gap-2">
        <Card className="w-full flex flex-row gap-2">
          <div className="space-y-1">
            <Text size="sm" variant="subtitle">
              {t("monthLabel")}
            </Text>
            <Select
              value={String(selectedMonth)}
              onValueChange={(val) =>
                setSelectedMonth(val === "all" ? "all" : Number(val))
              }
            >
              <SelectTrigger className="capitalize w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allMonths")}</SelectItem>
                {monthOptions.map((m) => (
                  <SelectItem
                    key={m.value}
                    value={String(m.value)}
                    className="capitalize"
                  >
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Text size="sm" variant="subtitle">
              {t("yearLabel")}
            </Text>
            <Select
              value={String(selectedYear)}
              onValueChange={(val) =>
                setSelectedYear(val === "all" ? "all" : Number(val))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allYears")}</SelectItem>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Enhanced Reschedule Card */}
        <Card className="p-3 w-full">
          <Text size="sm" className="font-medium text-subtitle mb-1">
            {selectedMonth === "all" || selectedYear === "all"
              ? t("reschedulesTitle")
              : t("reschedulesMonthTitle", {
                  month: monthOptions[selectedMonth as number]?.label,
                  year: selectedYear,
                })}
          </Text>
          <Text className="font-bold text-lg">
            {displayRescheduleInfo.count} / {displayRescheduleInfo.limit}
          </Text>
          {!isCurrentMonth &&
            selectedMonth !== "all" &&
            selectedYear !== "all" && (
              <Text size="xs" className="text-subtitle/30 mt-1">
                {t("historyLabel")}
              </Text>
            )}
        </Card>

        {/* Teacher Cancellation Credits Card */}
        <Card className="w-full p-3 bg-amber-50 border-amber-200">
          <Text size="sm" className="font-medium text-subtitle mb-1">
            {t("creditsTitle")}
          </Text>
          <Text className="font-bold text-lg text-amber-800">
            {teacherCancellationCredits}
          </Text>
          <Text size="xs" className="text-subtitle/30 mt-1">
            {t("creditsDesc")}
          </Text>
        </Card>
      </div>

      {filteredClasses.length > 0 ? (
        <div className="space-y-2">
          {filteredClasses.map((cls, index) => (
            <StudentClassCard
              key={`${cls.id}-${cls.scheduledAt}-${index}`}
              cls={cls}
              canReschedule={
                rescheduleInfo.allowed ||
                cls.status === "canceled-teacher-makeup"
              }
              onCancel={handleCancelClass}
              onReschedule={handleRescheduleClick}
              onCancelWithCheck={handleCancelWithRescheduleCheck}
            />
          ))}
        </div>
      ) : (
        !isLoading && (
          <NoResults
            customMessage={{
              withoutSearch:
                selectedMonth === "all" && selectedYear === "all"
                  ? t("noClassesTitle")
                  : t("noClassesFiltered", {
                      month:
                        selectedMonth !== "all"
                          ? monthOptions[selectedMonth as number]?.label
                          : t("allMonths"),
                      year:
                        selectedYear !== "all" ? selectedYear : t("allYears"),
                    }),
            }}
          />
        )
      )}
    </motion.div>
  );
}
