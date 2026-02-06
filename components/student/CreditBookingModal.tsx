"use client";

import { useState, useEffect } from "react";
import { useStudent } from "@/hooks/student/useStudent";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useTeacherAvailabilityForBooking } from "@/hooks/student/useTeacherAvailabilityForBooking";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { AvailableTimeSlot } from "@/hooks/student/useTeacherAvailabilityForBooking";

interface CreditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditType: "bonus" | "late_students";
}

export default function CreditBookingModal({
  isOpen,
  onClose,
  creditType,
}: CreditBookingModalProps) {
  const t = useTranslations("StudentClassesComponent");
  const locale = useLocale();
  const { bookClassWithCredit, isLoading: isBooking } = useStudent();
  const { user } = useCurrentUser();

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<AvailableTimeSlot | null>(
    null,
  );
  const [classTopic, setClassTopic] = useState("");
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);

  // Fetch teachers from user profile
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!user?.teachersIds || user.teachersIds.length === 0) {
        setTeachers([]);
        return;
      }

      const teachersData: { id: string; name: string }[] = [];

      try {
        await Promise.all(
          user.teachersIds.map(async (teacherId) => {
            const teacherRef = doc(db, "users", teacherId);
            const teacherSnap = await getDoc(teacherRef);

            if (teacherSnap.exists()) {
              const data = teacherSnap.data();
              teachersData.push({
                id: teacherSnap.id,
                name: data.name || data.nickname || "Professor",
              });
            }
          }),
        );

        setTeachers(teachersData);
      } catch (error) {
        console.error("Error fetching teachers:", error);
      }
    };

    if (user) {
      fetchTeachers();
    }
  }, [user]);

  // Set default teacher if only one exists
  useEffect(() => {
    if (isOpen && teachers.length === 1) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [isOpen, teachers]);

  const { availableSlots, isLoadingSlots } = useTeacherAvailabilityForBooking(
    isOpen && !!selectedTeacherId,
    selectedTeacherId,
    true, // onlyMakeup
  );

  const handleConfirm = async () => {
    if (!selectedTeacherId || !selectedSlot) return;

    const success = await bookClassWithCredit(
      selectedTeacherId,
      selectedSlot.date,
      selectedSlot.availabilitySlotId,
      creditType,
      classTopic,
    );

    if (success) {
      onClose();
      // Reset states
      setSelectedSlot(null);
      setClassTopic("");
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale === "pt" ? "pt-BR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key="booking"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ModalHeader>
              <ModalIcon type="calendar" />
              <ModalTitle>
                {creditType === "bonus"
                  ? "Agendar Aula Bônus"
                  : "Agendar Aula (Aluno Tardio)"}
              </ModalTitle>
              <ModalClose />
            </ModalHeader>

            <ModalBody>
              {teachers.length === 0 ? (
                <div className="text-center p-6 bg-yellow-50 rounded-lg">
                  <Text className="text-yellow-800">
                    Não foi possível encontrar seus professores. Entre em
                    contato com o suporte.
                  </Text>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Teacher Selection */}
                  {teachers.length > 1 && (
                    <div className="space-y-2">
                      <Text className="font-medium text-sm">
                        Selecione o Professor
                      </Text>
                      <Select
                        value={selectedTeacherId}
                        onValueChange={setSelectedTeacherId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Slots Selection */}
                  {selectedTeacherId && (
                    <div className="space-y-2">
                      <Text className="font-medium text-sm">
                        Horários Disponíveis
                      </Text>

                      {isLoadingSlots ? (
                        <div className="flex justify-center py-8">
                          <Spinner />
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center p-6 bg-gray-50 rounded-lg border border-dashed">
                          <Text className="text-gray-500">
                            Nenhum horário disponível encontrado para este
                            professor nos próximos 30 dias.
                          </Text>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                          {availableSlots.map((slot) => {
                            const isSelected =
                              selectedSlot?.availabilitySlotId ===
                                slot.availabilitySlotId &&
                              selectedSlot?.date.getTime() ===
                                slot.date.getTime();

                            return (
                              <Card
                                key={`${slot.availabilitySlotId}-${slot.date.getTime()}`}
                                className={`p-3 cursor-pointer transition-all border ${
                                  isSelected
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "hover:border-gray-300"
                                }`}
                                onClick={() => setSelectedSlot(slot)}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm capitalize">
                                    {formatDate(slot.date)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(slot.date)} - {slot.slotTitle}
                                  </span>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Topic */}
                  {selectedSlot && (
                    <div className="space-y-2">
                      <Text className="font-medium text-sm">
                        O que você quer estudar? (Opcional)
                      </Text>
                      <Textarea
                        value={classTopic}
                        onChange={(e) => setClassTopic(e.target.value)}
                        placeholder="Ex: Conversação, Gramática, Revisão..."
                        className="resize-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </ModalBody>

            <ModalFooter>
              <ModalSecondaryButton onClick={onClose}>
                Cancelar
              </ModalSecondaryButton>
              <ModalPrimaryButton
                onClick={handleConfirm}
                disabled={
                  !selectedTeacherId || !selectedSlot || isBooking || isBooking
                }
              >
                {isBooking ? "Agendando..." : "Confirmar Agendamento"}
              </ModalPrimaryButton>
            </ModalFooter>
          </motion.div>
        </AnimatePresence>
      </ModalContent>
    </Modal>
  );
}
