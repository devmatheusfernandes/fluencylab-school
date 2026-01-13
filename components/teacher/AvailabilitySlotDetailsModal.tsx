// components/teacher/AvailabilitySlotDetailsModal.tsx
"use client";

import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarEvent } from "@/types/calendar/calendar";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface AvailabilitySlotDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onDelete?: (
    slotId: string,
    deleteType: "single" | "future",
    occurrenceDate: Date
  ) => Promise<void>;
  onRefresh?: () => void;
}

export default function AvailabilitySlotDetailsModal({
  isOpen,
  onClose,
  event,
  onDelete,
  onRefresh,
}: AvailabilitySlotDetailsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [deleteType, setDeleteType] = useState<"single" | "future">("single");
  const t = useTranslations("TeacherSchedule.AvailabilityDetails");

  if (!event) return null;

  const handleDelete = async () => {
    if (!event?.slotId || !onDelete) return;
    setIsDeleting(true);
    try {
      // Use event.date directly since it's already a Date object
      await onDelete(event.slotId, deleteType, event.date);
      onClose();
      // Trigger refresh after successful deletion
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting availability:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteOptions(false);
    }
  };

  const getRepeatingTypeText = (type: string) => {
    switch (type) {
      case "weekly":
        return t("types.weekly");
      case "bi-weekly":
        return t("types.biWeekly");
      case "monthly":
        return t("types.monthly");
      default:
        return type;
    }
  };

  const getAvailabilityTypeText = (type: string) => {
    switch (type) {
      case "regular":
        return t("types.regular");
      case "makeup":
        return t("types.makeup");
      default:
        return type;
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{t("title")}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Card className="p-4">
              <Text variant="title" className="mb-3">
                {t("infoTitle")}
              </Text>

              <div className="space-y-2">
                <div>
                  <Text className="text-subtitle font-medium">
                    {t("startDate")}
                  </Text>
                  <Text>
                    {format(new Date(event.date), "PPP", {
                      locale: ptBR,
                    })}
                  </Text>
                </div>

                <div>
                  <Text className="text-subtitle font-medium">{t("time")}</Text>
                  <Text>
                    {event.startTime} - {event.endTime}
                  </Text>
                </div>

                <div>
                  <Text className="text-subtitle font-medium">{t("type")}</Text>
                  <Text>{event.repeating ? t("repeating") : t("single")}</Text>
                </div>

                {event.availabilityType && (
                  <div>
                    <Text className="text-subtitle font-medium">{t("category")}</Text>
                    <Text>
                      {getAvailabilityTypeText(event.availabilityType)}
                    </Text>
                  </div>
                )}

                {event.repeating && (
                  <>
                    <div>
                      <Text className="text-subtitle font-medium">
                        {t("frequency")}
                      </Text>
                      <Text>
                        {t("frequencyValue", {
                          type: getRepeatingTypeText(event.repeating.type),
                          interval: event.repeating.interval
                        })}
                      </Text>
                    </div>
                    {event.repeating.endDate && (
                      <div>
                        <Text className="text-subtitle font-medium">
                          {t("endDate")}
                        </Text>
                        <Text>
                          {format(new Date(event.repeating.endDate), "PPP", {
                            locale: ptBR,
                          })}
                        </Text>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* Delete Confirmation Section */}
            {showDeleteOptions && (
              <Card className="p-4 border border-red-200 bg-red-50">
                <Text variant="title" className="mb-3 text-red-800">
                  {t("deleteTitle")}
                </Text>

                {event?.repeating ? (
                  <div className="space-y-4">
                    <Text className="text-red-700">
                      {t("deleteRepeatingQuestion")}
                    </Text>
                    <div className="space-y-2">
                      <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-red-100">
                        <input
                          type="radio"
                          name="deleteType"
                          checked={deleteType === "single"}
                          onChange={() => setDeleteType("single")}
                          className="mr-2"
                        />
                        <div>
                          <Text className="font-medium">
                            {t("deleteSingle")}
                          </Text>
                          <Text size="sm" className="text-gray-600">
                            {t("deleteSingleDesc", {
                              date: format(new Date(event.date), "PPP", {
                                locale: ptBR,
                              })
                            })}
                          </Text>
                        </div>
                      </label>
                      <label className="flex items-center p-2 border rounded cursor-pointer hover:bg-red-100">
                        <input
                          type="radio"
                          name="deleteType"
                          checked={deleteType === "future"}
                          onChange={() => setDeleteType("future")}
                          className="mr-2"
                        />
                        <div>
                          <Text className="font-medium">
                            {t("deleteFuture")}
                          </Text>
                          <Text size="sm" className="text-gray-600">
                            {t("deleteFutureDesc")}
                          </Text>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <Text className="text-red-700">
                    {t("deleteConfirmation")}
                  </Text>
                )}

                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteOptions(false)}
                    disabled={isDeleting}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? t("deleting") : t("delete")}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="flex justify-between">
          {onDelete && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteOptions(true)}
            >
              {t("delete")}
            </Button>
          )}
          <Button onClick={onClose}>{t("close")}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
