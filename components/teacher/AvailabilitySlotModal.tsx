// components/teacher/AvailabilitySlotModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
  ModalPrimaryButton,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AvailabilityType } from "@/types/time/availability";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "../ui/spinner";
import { useTranslations } from "next-intl";

interface AvailabilitySlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  onSlotCreated: () => void;
}

export default function AvailabilitySlotModal({
  isOpen,
  onClose,
  selectedDate,
  onSlotCreated,
}: AvailabilitySlotModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AvailabilityType>(AvailabilityType.REGULAR);
  const [startDate, setStartDate] = useState<Date>(selectedDate || new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:45");
  const [isRepeating, setIsRepeating] = useState(true); // Sempre true para regular por padrão
  const [repeatingType, setRepeatingType] = useState("weekly");
  const [interval, setInterval] = useState(1);
  const [endDate, setEndDate] = useState("");
  const [hasEndDate, setHasEndDate] = useState(false); // Novo estado para controlar se tem data fim
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("TeacherSchedule.AvailabilityForm");

  // Atualizar isRepeating baseado no tipo
  useEffect(() => {
    if (type === AvailabilityType.REGULAR) {
      setIsRepeating(true); // Horários regulares sempre são repetitivos
    } else {
      setIsRepeating(false); // Horários de makeup começam como não repetitivos
    }
  }, [type]);

  // Set default end time when start time changes
  useEffect(() => {
    if (startTime) {
      const [hours, minutes] = startTime.split(":").map(Number);
      const end = new Date();
      end.setHours(hours, minutes + 45, 0, 0);
      setEndTime(
        `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`
      );
    }
  }, [startTime]);

  // Set default date when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setStartDate(selectedDate);
      const endDate = new Date(selectedDate);
      endDate.setMonth(endDate.getMonth() + 3);
      setEndDate(endDate.toISOString().split("T")[0]);
    }
  }, [selectedDate]);

  // Set default end date when startDate changes
  useEffect(() => {
    if (startDate) {
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3);
      setEndDate(endDate.toISOString().split("T")[0]);
    }
  }, [startDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: any = {
        title,
        type,
        startDate: startDate,
        startTime,
        endTime,
      };

      if (isRepeating) {
        payload.repeating = {
          type: repeatingType,
          interval: Number(interval),
          endDate: hasEndDate && endDate ? new Date(endDate) : undefined,
        };
      }

      const response = await fetch("/api/teacher/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create availability slot");
      }

      toast.success(t("successToast"));
      onSlotCreated();
      onClose();
    } catch (error: any) {
      toast.error(error.message || t("errorToast"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="overflow-y-auto">
        <ModalHeader>
          <ModalTitle>{t("addTitle")}</ModalTitle>
          <ModalDescription>
            {t("addDescription")}
          </ModalDescription>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-3">
            <div>
              <label htmlFor="type">{t("typeLabel")}</label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as AvailabilityType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AvailabilityType.REGULAR}>
                    {t("typeRegular")}
                  </SelectItem>
                  <SelectItem value={AvailabilityType.MAKEUP}>
                    {t("typeMakeup")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="startDate">{t("startDateLabel")}</label>
              <Input
                id="startDate"
                type="date"
                value={startDate.toISOString().split("T")[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime">{t("startTimeLabel")}</label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="endTime">{t("endTimeLabel")}</label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Mostrar checkbox de repetição apenas para horários de makeup */}
            {type === AvailabilityType.MAKEUP && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRepeating"
                  checked={isRepeating}
                  onCheckedChange={(checked) =>
                    setIsRepeating(checked as boolean)
                  }
                />
                <label htmlFor="isRepeating">{t("repeatLabel")}</label>
              </div>
            )}

            {isRepeating && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="repeatingType">{t("frequencyLabel")}</label>
                  <Select
                    value={repeatingType}
                    onValueChange={setRepeatingType}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">{t("frequencies.weekly")}</SelectItem>
                      <SelectItem value="bi-weekly">{t("frequencies.biWeekly")}</SelectItem>
                      <SelectItem value="monthly">{t("frequencies.monthly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="interval">{t("intervalLabel")}</label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    value={interval}
                    onChange={(e) => setInterval(Number(e.target.value))}
                    required
                  />
                </div>

                {/* Para horários regulares, permitir escolher entre tempo indefinido ou data específica */}
                {type === AvailabilityType.REGULAR && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasEndDate"
                      checked={hasEndDate}
                      onCheckedChange={(checked) =>
                        setHasEndDate(checked as boolean)
                      }
                    />
                    <label htmlFor="hasEndDate">{t("defineEndDateLabel")}</label>
                  </div>
                )}

                {/* Mostrar campo de data de término baseado no tipo e configuração */}
                {((type === AvailabilityType.REGULAR && hasEndDate) ||
                  type === AvailabilityType.MAKEUP) && (
                  <div>
                    <label htmlFor="endDate">
                      {type === AvailabilityType.REGULAR
                        ? t("endDateLabel")
                        : t("endDateOptionalLabel")}
                    </label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required={type === AvailabilityType.REGULAR && hasEndDate}
                    />
                  </div>
                )}

                {/* Mostrar informação sobre tempo indefinido para horários regulares */}
                {type === AvailabilityType.REGULAR && !hasEndDate && (
                  <Badge>{t("indefiniteBadge")}</Badge>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <ModalPrimaryButton type="submit" disabled={isLoading}>
              {isLoading ? <Spinner /> : t("submitButton")}
            </ModalPrimaryButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
