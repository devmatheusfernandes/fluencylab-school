"use client";

import React, { useState } from "react";
import { TeacherOnboardingStepProps } from "../../TeacherOnboardingModal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Clock, Info } from "lucide-react";
import { toast } from "sonner";
import { AvailabilityType } from "@/types/time/availability";

export interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  title: string;
  type: AvailabilityType;
}

const DAYS = [
  { value: 1, label: "Segunda", short: "Seg" },
  { value: 2, label: "Terça", short: "Ter" },
  { value: 3, label: "Quarta", short: "Qua" },
  { value: 4, label: "Quinta", short: "Qui" },
  { value: 5, label: "Sexta", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
  { value: 0, label: "Domingo", short: "Dom" },
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

export const ScheduleSelectionStep: React.FC<TeacherOnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const [newSlot, setNewSlot] = useState<{
    dayOfWeek: string;
    startTime: string;
    type: AvailabilityType;
  }>({
    dayOfWeek: "1",
    startTime: "09:00",
    type: AvailabilityType.REGULAR,
  });

  const calculateEndTime = (start: string) => {
    const [h, m] = start.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m + 45, 0, 0);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const checkConflict = (
    currentSlots: ScheduleSlot[],
    candidate: typeof newSlot,
    candidateEnd: string,
  ) => {
    return currentSlots.some((slot) => {
      if (slot.dayOfWeek !== parseInt(candidate.dayOfWeek)) return false;
      return (
        candidate.startTime < slot.endTime && candidateEnd > slot.startTime
      );
    });
  };

  const addSlot = () => {
    const endTime = calculateEndTime(newSlot.startTime);

    if (checkConflict(data.scheduleSlots, newSlot, endTime)) {
      toast.error("Este horário entra em conflito com outro já existente.");
      return;
    }

    const defaultTitle =
      newSlot.type === AvailabilityType.REGULAR ? "Aula Regular" : "Reposição";

    const slotToAdd: ScheduleSlot = {
      id: Math.random().toString(36).substr(2, 9),
      dayOfWeek: parseInt(newSlot.dayOfWeek),
      startTime: newSlot.startTime,
      endTime: endTime,
      title: defaultTitle,
      type: newSlot.type,
    };

    onDataChange({ scheduleSlots: [...data.scheduleSlots, slotToAdd] });
    toast.success("Horário adicionado!");
  };

  const removeSlot = (id: string) => {
    onDataChange({
      scheduleSlots: data.scheduleSlots.filter((s) => s.id !== id),
    });
  };

  const regularCount = data.scheduleSlots.filter(
    (s) => s.type === AvailabilityType.REGULAR,
  ).length;
  const makeupCount = data.scheduleSlots.filter(
    (s) => s.type === AvailabilityType.MAKEUP,
  ).length;
  const isComplete = regularCount >= 3 && makeupCount >= 3;

  return (
    <div className="max-w-xl mx-auto flex flex-col h-full space-y-6 py-4">
      <header className="flex justify-between items-end px-1">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Disponibilidade
          </h2>
          <p className="text-sm text-muted-foreground">
            Sessões fixas de 45 minutos.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant={regularCount >= 3 ? "default" : "secondary"}
            className="h-6 font-mono"
          >
            REG: {regularCount}/3
          </Badge>
          <Badge
            variant={makeupCount >= 3 ? "default" : "secondary"}
            className="h-6 font-mono"
          >
            REP: {makeupCount}/3
          </Badge>
        </div>
      </header>

      <div className="flex flex-col gap-3 p-4 bg-muted/40 rounded-xl border border-border/50 shadow-sm">
        <div className="flex flex-row items-center gap-2">
          <Select
            value={newSlot.dayOfWeek}
            onValueChange={(v) => setNewSlot({ ...newSlot, dayOfWeek: v })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => (
                <SelectItem key={d.value} value={d.value.toString()}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={newSlot.startTime}
            onValueChange={(v) => setNewSlot({ ...newSlot, startTime: v })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addSlot} size="icon">
            <Plus className="w-4 h-4" />
          </Button>

          <span className="text-[11px] font-medium text-primary/50 italic">
            Termina às {calculateEndTime(newSlot.startTime)}
          </span>
        </div>

        <div className="flex items-center justify-between self-center">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                className="w-3.5 h-3.5 accent-primary cursor-pointer"
                checked={newSlot.type === AvailabilityType.REGULAR}
                onChange={() =>
                  setNewSlot({ ...newSlot, type: AvailabilityType.REGULAR })
                }
              />
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">
                Regular
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                className="w-3.5 h-3.5 accent-primary cursor-pointer"
                checked={newSlot.type === AvailabilityType.MAKEUP}
                onChange={() =>
                  setNewSlot({ ...newSlot, type: AvailabilityType.MAKEUP })
                }
              />
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">
                Reposição
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[250px]">
        {data.scheduleSlots.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-muted-foreground/40">
            <Clock className="w-6 h-6 mb-2" />
            <p className="text-xs font-medium uppercase tracking-widest">
              Nenhum horário
            </p>
          </div>
        ) : (
          data.scheduleSlots
            .sort(
              (a, b) =>
                a.dayOfWeek - b.dayOfWeek ||
                a.startTime.localeCompare(b.startTime),
            )
            .map((slot) => (
              <div
                key={slot.id}
                className="flex items-center gap-4 p-3 hover:bg-muted/30 rounded-lg border border-transparent hover:border-border transition-all group"
              >
                <div
                  className={`w-1 h-10 rounded-full shrink-0 ${slot.type === AvailabilityType.REGULAR ? "bg-blue-500" : "bg-purple-500"}`}
                />

                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 items-center gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">
                      {DAYS.find((d) => d.value === slot.dayOfWeek)?.label}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-tighter sm:hidden">
                      {slot.type === AvailabilityType.REGULAR
                        ? "Regular"
                        : "Reposição"}
                    </span>
                  </div>

                  <span className="text-sm font-medium tabular-nums text-muted-foreground text-center">
                    {slot.startTime} — {slot.endTime}
                  </span>

                  <span className="hidden sm:block text-[10px] text-right pr-4 text-muted-foreground/50 uppercase font-black tracking-widest">
                    {slot.type === AvailabilityType.REGULAR
                      ? "Regular"
                      : "Reposição"}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSlot(slot.id)}
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
        )}
      </div>

      {!isComplete && (
        <div className="flex items-start gap-3 p-4 bg-amber-50/50 dark:bg-amber-950/10 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-400 uppercase tracking-tight">
              Requisitos da Agenda
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-500 leading-relaxed">
              Adicione pelo menos 3 horários <strong>Regulares</strong> e 3 de{" "}
              <strong>Reposição</strong> para prosseguir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
