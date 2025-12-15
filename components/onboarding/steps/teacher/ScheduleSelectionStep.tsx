// components/onboarding/steps/teacher/ScheduleSelectionStep.tsx
"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Info, CheckCircle2, XCircle, Activity } from "lucide-react";
import { AvailabilityType } from "@/types/time/availability";

export interface ScheduleSlot {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "HH:MM" format
  endTime: string; // "HH:MM" format
  title: string;
  type: AvailabilityType; // Adicionado para compatibilidade com sistema de disponibilidade
}

interface ScheduleSelectionStepProps {
  data: ScheduleSlot[];
  onDataChange: (slots: ScheduleSlot[]) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Segunda-feira", short: "SEG" },
  { value: 2, label: "Terça-feira", short: "TER" },
  { value: 3, label: "Quarta-feira", short: "QUA" },
  { value: 4, label: "Quinta-feira", short: "QUI" },
  { value: 5, label: "Sexta-feira", short: "SEX" },
  { value: 6, label: "Sábado", short: "SÁB" },
  { value: 0, label: "Domingo", short: "DOM" },
];

const TIME_SLOTS = [
  "06:00",
  "06:45",
  "07:30",
  "08:15",
  "09:00",
  "09:45",
  "10:30",
  "11:15",
  "12:00",
  "12:45",
  "13:30",
  "14:15",
  "15:00",
  "15:45",
  "16:30",
  "17:15",
  "18:00",
  "18:45",
  "19:30",
  "20:15",
  "21:00",
  "21:45",
];

export const ScheduleSelectionStep: React.FC<ScheduleSelectionStepProps> = ({
  data,
  onDataChange,
  onNext,
  onBack,
  isLoading,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlot, setNewSlot] = useState<Partial<ScheduleSlot>>({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "09:45", // Duração padrão de 45 minutos
    title: "",
    type: AvailabilityType.REGULAR, // Sempre REGULAR no onboarding
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateSlotId = () => {
    return `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Função para calcular o horário de fim baseado no início (45 minutos)
  const calculateEndTime = (startTime: string): string => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    // Adicionar 45 minutos
    const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);

    return `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;
  };

  const validateNewSlot = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newSlot.title?.trim()) {
      newErrors.title = "Título é obrigatório";
    }

    if (!newSlot.startTime) {
      newErrors.startTime = "Horário de início é obrigatório";
    }

    // Validar se o horário de fim está correto (45 minutos após o início)
    if (newSlot.startTime) {
      const expectedEndTime = calculateEndTime(newSlot.startTime);
      if (newSlot.endTime !== expectedEndTime) {
        newErrors.endTime = "Duração deve ser de 45 minutos";
      }
    }

    // Check for conflicts with existing slots
    if (
      newSlot.dayOfWeek !== undefined &&
      newSlot.startTime &&
      newSlot.endTime
    ) {
      const conflicts = data.filter(
        (slot) =>
          slot.dayOfWeek === newSlot.dayOfWeek &&
          ((newSlot.startTime! >= slot.startTime &&
            newSlot.startTime! < slot.endTime) ||
            (newSlot.endTime! > slot.startTime &&
              newSlot.endTime! <= slot.endTime) ||
            (newSlot.startTime! <= slot.startTime &&
              newSlot.endTime! >= slot.endTime))
      );

      if (conflicts.length > 0) {
        newErrors.startTime = "Conflito com horário existente";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSlot = () => {
    if (validateNewSlot()) {
      const slot: ScheduleSlot = {
        id: generateSlotId(),
        dayOfWeek: newSlot.dayOfWeek!,
        startTime: newSlot.startTime!,
        endTime: newSlot.endTime!,
        title: newSlot.title!.trim(),
        type: AvailabilityType.REGULAR, // Sempre REGULAR no onboarding
      };

      onDataChange([...data, slot]);
      setNewSlot({
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "09:45",
        title: "",
        type: AvailabilityType.REGULAR,
      });
      setShowAddForm(false);
      setErrors({});
    }
  };

  const handleRemoveSlot = (slotId: string) => {
    onDataChange(data.filter((slot) => slot.id !== slotId));
  };

  // Atualizar horário de fim quando o horário de início mudar
  const handleStartTimeChange = (startTime: string) => {
    const endTime = calculateEndTime(startTime);
    setNewSlot((prev) => ({
      ...prev,
      startTime,
      endTime,
    }));
  };

  const formatTime = (time: string) => {
    return time;
  };

  const getDayLabel = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find((day) => day.value === dayOfWeek)?.label || "";
  };

  const getDayShort = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find((day) => day.value === dayOfWeek)?.short || "";
  };

  const canProceed = data.length >= 5;

  const groupedSlots = data.reduce(
    (acc, slot) => {
      if (!acc[slot.dayOfWeek]) {
        acc[slot.dayOfWeek] = [];
      }
      acc[slot.dayOfWeek].push(slot);
      return acc;
    },
    {} as Record<number, ScheduleSlot[]>
  );

  // Sort slots within each day by start time
  Object.keys(groupedSlots).forEach((day) => {
    groupedSlots[parseInt(day)].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
  });

  return (
    <div className="flex-1 px-8 py-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <Text variant="title" size="xl" weight="bold" className="mb-2">
            Seus Horários Regulares
          </Text>
          <Text variant="subtitle" className="max-w-2xl mx-auto">
            Configure seus horários de disponibilidade regulares. Cada período
            tem duração de 45 minutos. Você precisa de pelo menos 5 horários
            para começar.
          </Text>
        </div>

        {/* Progress Indicator */}
        <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <Text
                size="sm"
                weight="medium"
                className="text-blue-800 dark:text-blue-200"
              >
                Progresso: {data.length} de 5 horários mínimos (45 min cada)
              </Text>
            </div>
            <div className="flex items-center gap-2">
              {data.length >= 5 ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Pronto!
                </Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200">
                  Faltam {5 - data.length}
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {/* Current Schedule */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Text size="lg" weight="semibold">
              Seus Horários ({data.length})
            </Text>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Adicionar Horário
            </Button>
          </div>

          {data.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <Text className="text-gray-500">
                Nenhum horário adicionado ainda
              </Text>
              <Text size="sm" className="text-gray-400 mt-1">
                Clique em Adicionar Horário para começar
              </Text>
            </div>
          ) : (
            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const daySlots = groupedSlots[day.value] || [];
                if (daySlots.length === 0) return null;

                return (
                  <div
                    key={day.value}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <Text weight="semibold" className="mb-3">
                      {day.label}
                    </Text>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div>
                            <Text size="sm" weight="medium">
                              {slot.title}
                            </Text>
                            <Text size="xs" className="text-gray-500">
                              {formatTime(slot.startTime)} -{" "}
                              {formatTime(slot.endTime)} (45min)
                            </Text>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSlot(slot.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Add Slot Form */}
        {showAddForm && (
          <Card className="p-6 mb-6 border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between mb-4">
              <Text size="lg" weight="semibold">
                Adicionar Novo Horário (45 minutos)
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setErrors({});
                }}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Dia da Semana
                </label>
                <select
                  value={newSlot.dayOfWeek}
                  onChange={(e) =>
                    setNewSlot((prev) => ({
                      ...prev,
                      dayOfWeek: parseInt(e.target.value),
                    }))
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Horário de Início
                </label>
                <select
                  value={newSlot.startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  {TIME_SLOTS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                {errors.startTime && (
                  <Text size="sm" className="text-red-600 mt-1">
                    {errors.startTime}
                  </Text>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Título do Horário
                </label>
                <input
                  type="text"
                  value={newSlot.title}
                  onChange={(e) =>
                    setNewSlot((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Ex: Aula Regular"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
                {errors.title && (
                  <Text size="sm" className="text-red-600 mt-1">
                    {errors.title}
                  </Text>
                )}
              </div>
            </div>

            {/* Mostrar horário de fim calculado automaticamente */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Text size="sm" className="text-blue-800 dark:text-blue-200">
                <strong>Horário de fim:</strong> {newSlot.endTime} (duração de
                45 minutos)
              </Text>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setErrors({});
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddSlot}>Adicionar</Button>
            </div>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="secondary" onClick={onBack} disabled={isLoading}>
            Voltar
          </Button>
          <Button onClick={onNext} disabled={isLoading || !canProceed}>
            {canProceed
              ? "Continuar"
              : `Adicione mais ${5 - data.length} horário(s)`}
          </Button>
        </div>
      </div>
    </div>
  );
};
