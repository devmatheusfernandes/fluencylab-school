"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PopulatedStudentClass, StudentClass } from "@/types/classes/class";
import { AvailabilitySlot } from "@/types/time/availability";
import { AvailableTimeSlot } from "@/hooks/teacher/useTeacherAvailabilityForReschedule";
import { useStudent } from "@/hooks/student/useStudent";
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalIcon,
  ModalPrimaryButton,
  ModalSecondaryButton,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { useTeacherAvailabilityForReschedule } from "@/hooks/teacher/useTeacherAvailabilityForReschedule";
import { Card } from "@/components/ui/card";
import { Spinner } from "../ui/spinner";
import { useTranslations, useLocale } from "next-intl";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  classToReschedule: PopulatedStudentClass | null;
}

export default function RescheduleModal({
  isOpen,
  onClose,
  classToReschedule,
}: RescheduleModalProps) {
  const t = useTranslations("RescheduleModal");
  const tLanguages = useTranslations("Languages");
  const locale = useLocale();

  const getTranslatedLanguage = (lang: string) => {
    const lower = lang.toLowerCase();
    if (lower === 'english' || lower === 'ingles' || lower === 'inglês') return tLanguages('english');
    if (lower === 'spanish' || lower === 'espanhol') return tLanguages('spanish');
    if (lower === 'libras') return tLanguages('libras');
    if (lower === 'portuguese' || lower === 'portugues' || lower === 'português') return tLanguages('portuguese');
    return lang;
  };

  const {
    rescheduleClass,
    fetchTeacherAvailability,
    isLoading: isHookLoading,
  } = useStudent();
  const [selectedSlot, setSelectedSlot] = useState<AvailableTimeSlot | null>(
    null
  );
  const [reason, setReason] = useState("");
  const { availableSlots, isLoadingSlots } =
    useTeacherAvailabilityForReschedule(isOpen, classToReschedule);

  const handleConfirmReschedule = async () => {
    if (!classToReschedule || !selectedSlot) return;

    const success = await rescheduleClass(
      classToReschedule.id,
      selectedSlot.date,
      reason,
      selectedSlot.availabilitySlotId
    );
    if (success) {
      onClose();
    }
  };

  // Check if this is a teacher makeup class that will use a teacher cancellation credit
  const isTeacherMakeupClass =
    classToReschedule?.status === "canceled-teacher-makeup";

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <AnimatePresence mode="wait">
          <motion.div
            key="reschedule"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ModalHeader>
              <ModalIcon type="calendar" />
              <ModalTitle>{t("title")}</ModalTitle>
              <ModalClose />
            </ModalHeader>
            {classToReschedule && (
              <ModalBody>
                <Text variant="subtitle" size="sm" className="text-center mb-6">
                  {t("selectNewTime", { teacherName: classToReschedule.teacherName ?? "" })}
                </Text>

                {isTeacherMakeupClass && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800 text-center">
                      {t("teacherCancellationWarning")}
                    </p>
                  </div>
                )}

                <div className="text-center p-4 bg-primary/20 dark:bg-primary/20 rounded-xl border border-primary/80 dark:border-primary/80 mb-6">
                  <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {t("rescheduleInfo", {
                      language: getTranslatedLanguage(classToReschedule.language),
                      date: formatDate(new Date(classToReschedule.scheduledAt))
                    })}
                  </div>
                </div>

                {isLoadingSlots ? (
                  <Spinner className="my-2" />
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {availableSlots.length > 0 ? (
                      availableSlots.map((slot) => (
                        <Card
                          key={`${slot.availabilitySlotId}-${slot.date.toISOString()}`}
                          className={`cursor-pointer transition-all duration-200 ${
                            selectedSlot?.date.getTime() === slot.date.getTime()
                              ? "!border-2 !border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
                          }`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <div className="p-4">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {formatDate(slot.date)} às{" "}
                              {slot.date.toLocaleTimeString(locale === "pt" ? "pt-BR" : "en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <div className="text-gray-500 dark:text-gray-400 font-medium">
                            {t("noSlots")}
                          </div>
                          <div className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                            {t("noOptions")}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!isTeacherMakeupClass && (
                  <div className="mt-4">
                    <label
                      htmlFor="reason"
                      className="block text-sm font-medium text-subtitle mb-1"
                    >
                      {t("reasonLabel")}
                    </label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t("reasonPlaceholder")}
                    />
                  </div>
                )}
              </ModalBody>
            )}
            <ModalFooter>
              <ModalSecondaryButton onClick={onClose}>
                {t("cancel")}
              </ModalSecondaryButton>
              <ModalPrimaryButton
                onClick={handleConfirmReschedule}
                disabled={!selectedSlot || isHookLoading}
              >
                {isHookLoading
                  ? t("rescheduling")
                  : isTeacherMakeupClass
                    ? t("confirmCredit")
                    : t("confirmNewTime")}
              </ModalPrimaryButton>
            </ModalFooter>
          </motion.div>
        </AnimatePresence>
      </ModalContent>
    </Modal>
  );
}
