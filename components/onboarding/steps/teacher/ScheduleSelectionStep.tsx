import React, { useState } from "react";
import { TeacherOnboardingStepProps } from "../../TeacherOnboardingModal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import { useTranslations } from "next-intl";
import { ScheduleSlot } from "@/types/onboarding/teacher";
import { AvailabilityType } from "@/types/time/availability";

export const ScheduleSelectionStep: React.FC<TeacherOnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const t = useTranslations("Onboarding.Teacher.Schedule");

  const [newSlot, setNewSlot] = useState<Partial<ScheduleSlot>>({
    dayOfWeek: 1,
    startTime: "09:00",
    type: AvailabilityType.REGULAR,
  });

  const DAYS = [
    { value: 0, label: t("days.sunday") },
    { value: 1, label: t("days.monday") },
    { value: 2, label: t("days.tuesday") },
    { value: 3, label: t("days.wednesday") },
    { value: 4, label: t("days.thursday") },
    { value: 5, label: t("days.friday") },
    { value: 6, label: t("days.saturday") },
  ];

  const handleAddSlot = () => {
    if (!newSlot.startTime) return;

    // Check for conflicts
    const conflict = data.scheduleSlots.some(
      (slot) =>
        slot.dayOfWeek === newSlot.dayOfWeek &&
        slot.startTime === newSlot.startTime,
    );

    if (conflict) {
      toast.error(t("conflictError"));
      return;
    }

    const slotToAdd: ScheduleSlot = {
      id: Math.random().toString(36).substr(2, 9),
      dayOfWeek: newSlot.dayOfWeek!,
      startTime: newSlot.startTime!,
      endTime: calculateEndTime(newSlot.startTime!),
      type: newSlot.type || AvailabilityType.REGULAR,
      title: "Available Slot",
    };

    onDataChange({
      scheduleSlots: [...data.scheduleSlots, slotToAdd].sort(
        (a, b) =>
          a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
      ),
    });

    toast.success(t("addedSuccess"));
  };

  const removeSlot = (id: string) => {
    onDataChange({
      scheduleSlots: data.scheduleSlots.filter((s) => s.id !== id),
    });
  };

  const calculateEndTime = (start: string) => {
    const [h, m] = start.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m + 45);
    return date.toTimeString().slice(0, 5);
  };

  const regularSlots = data.scheduleSlots.filter(
    (s) => s.type === AvailabilityType.REGULAR,
  );
  const makeupSlots = data.scheduleSlots.filter(
    (s) => s.type === AvailabilityType.MAKEUP,
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto h-[70vh] flex flex-col">
      <div className="text-center space-y-2 shrink-0">
        <h3 className="text-xl font-bold">{t("title")}</h3>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Form */}
        <div className="w-full md:w-1/3 space-y-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl h-fit">
          <div className="space-y-2">
            <label className="text-sm font-medium">Dia</label>
            <Select
              value={newSlot.dayOfWeek?.toString()}
              onValueChange={(v) =>
                setNewSlot({ ...newSlot, dayOfWeek: parseInt(v) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => (
                  <SelectItem key={day.value} value={day.value.toString()}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Início</label>
            <Select
              value={newSlot.startTime}
              onValueChange={(v) => setNewSlot({ ...newSlot, startTime: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Array.from({ length: 24 }).map((_, i) =>
                  ["00", "15", "30", "45"].map((m) => {
                    const time = `${i.toString().padStart(2, "0")}:${m}`;
                    return (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    );
                  }),
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("endsAt", { time: calculateEndTime(newSlot.startTime!) })}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <div className="flex gap-2">
              <Button
                variant={
                  newSlot.type === AvailabilityType.REGULAR
                    ? "glass"
                    : "outline"
                }
                onClick={() =>
                  setNewSlot({ ...newSlot, type: AvailabilityType.REGULAR })
                }
                className="flex-1"
                size="sm"
              >
                {t("typeRegular")}
              </Button>
              <Button
                variant={
                  newSlot.type === AvailabilityType.MAKEUP
                    ? "secondary"
                    : "outline"
                }
                onClick={() =>
                  setNewSlot({ ...newSlot, type: AvailabilityType.MAKEUP })
                }
                className="flex-1"
                size="sm"
              >
                {t("typeMakeup")}
              </Button>
            </div>
          </div>

          <Button onClick={handleAddSlot} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> Adicionar
          </Button>

          <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">{t("requirementsTitle")}</p>
            <p
              dangerouslySetInnerHTML={{ __html: t.raw("requirementsText") }}
            />
            <div className="flex justify-between items-center mt-2">
              <span>
                {t("typeRegular")}: {regularSlots.length}/3
              </span>
              <span>
                {t("typeMakeup")}: {makeupSlots.length}/3
              </span>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto border rounded-xl p-4">
          {data.scheduleSlots.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <Clock className="w-12 h-12 mb-2" />
              <p>{t("empty")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.scheduleSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        slot.type === AvailabilityType.REGULAR
                          ? "default"
                          : "secondary"
                      }
                    >
                      {slot.type === AvailabilityType.REGULAR ? "R" : "M"}
                    </Badge>
                    <div>
                      <p className="font-medium">
                        {DAYS.find((d) => d.value === slot.dayOfWeek)?.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSlot(slot.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
