"use client";

import { useTeacher } from "@/hooks/useTeacher";
import { User } from "@/types/users/users";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  CheckCheckIcon,
  Clock,
  Clock1,
  RefreshCw,
  Settings,
  X,
} from "lucide-react";
import { ButtonGroup, ButtonGroupSeparator } from "../ui/button-group";

interface SchedulingSettings {
  bookingLeadTimeHours: number;
  cancellationPolicyHours: number;
  bookingHorizonDays: number;
}

type SettingsData = SchedulingSettings;

interface TeacherSettingsFormProps {
  currentSettings: SettingsData;
}

interface SettingField {
  key: keyof SettingsData;
  label: string;
  description: string;
  placeholder: string;
  defaultValue: number;
  icon: React.ReactNode;
  unit: string;
  min?: number;
  max?: number;
}

export default function TeacherSettingsForm({
  currentSettings,
}: TeacherSettingsFormProps) {
  const [settings, setSettings] = useState(currentSettings);
  const { updateSettings, isLoading, error, successMessage } = useTeacher();

  const settingFields: SettingField[] = [
    {
      key: "bookingLeadTimeHours",
      label: "Antecedência Mínima",
      description: "Tempo mínimo necessário para agendamento de aulas",
      placeholder: "24",
      defaultValue: 24,
      icon: <Clock className="w-5 h-5" />,
      unit: "horas",
      min: 1,
      max: 168, // 1 week
    },
    {
      key: "bookingHorizonDays",
      label: "Horizonte de Agendamento",
      description: "Quantos dias no futuro os alunos podem agendar",
      placeholder: "30",
      defaultValue: 30,
      icon: <Calendar className="w-5 h-5" />,
      unit: "dias",
      min: 1,
      max: 365,
    },
  ];

  const handleInputChange = (field: keyof SettingsData, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value ? Number(value) : undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(settings);
  };

  const resetToDefaults = () => {
    const defaultSettings = settingFields.reduce(
      (acc, field) => ({
        ...acc,
        [field.key]: field.defaultValue,
      }),
      {} as SettingsData
    );

    setSettings(defaultSettings);
  };

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(currentSettings);

  return (
    <div className="mx-auto space-y-6 mt-4">
      {/* Settings Form */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-8">
            {/* Success/Error Messages */}
            {successMessage && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  <CheckCheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <Text
                    size="sm"
                    className="font-medium text-emerald-700 dark:text-emerald-300"
                  >
                    {successMessage}
                  </Text>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <Text
                    size="sm"
                    className="font-medium text-red-700 dark:text-red-300"
                  >
                    {error}
                  </Text>
                </div>
              </div>
            )}

            {/* Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {settingFields.map((field) => {
                const currentValue = settings?.[field.key];
                const isDefault =
                  currentValue === field.defaultValue ||
                  (!currentValue && field.defaultValue === 0);

                return (
                  <div
                    key={field.key}
                    className="space-y-4 p-6 bg-slate-300 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    {/* Field Header */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white/10 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                        <div className="text-slate-600 dark:text-slate-400">
                          {field.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Text
                            size="base"
                            className="font-semibold text-slate-900 dark:text-slate-100"
                          >
                            {field.label}
                          </Text>
                          {isDefault && (
                            <span className="px-2 py-1 bg-primary/10 dark:bg-blue-900/30 text-primary dark:text-blue-300 text-xs font-medium rounded-md">
                              Padrão
                            </span>
                          )}
                        </div>
                        <Text
                          size="sm"
                          className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed"
                        >
                          {field.description}
                        </Text>
                      </div>
                    </div>

                    {/* Input Field */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="number"
                          value={currentValue?.toString() || ""}
                          onChange={(e) =>
                            handleInputChange(field.key, e.target.value)
                          }
                          placeholder={field.placeholder}
                          min={field.min}
                          max={field.max}
                          className="pr-16 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                          disabled={isLoading}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Text
                            size="sm"
                            className="text-slate-500 dark:text-slate-400 font-medium"
                          >
                            {field.unit}
                          </Text>
                        </div>
                      </div>

                      {/* Range indicator */}
                      {field.min !== undefined && field.max !== undefined && (
                        <div className="flex justify-between">
                          <Text
                            size="xs"
                            className="text-slate-400 dark:text-slate-500"
                          >
                            Mín: {field.min}
                          </Text>
                          <Text
                            size="xs"
                            className="text-slate-400 dark:text-slate-500"
                          >
                            Máx: {field.max}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                onClick={resetToDefaults}
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Restaurar Padrões
              </Button>

              <div className="flex flex-col">
                <ButtonGroup>
                <Button type="button" disabled={!hasChanges}>
                  Cancelar
                </Button>
                <ButtonGroupSeparator />
                  <Button type="submit" disabled={isLoading || !hasChanges}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Salvando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Salvar Configurações
                      </div>
                    )}
                  </Button>
                </ButtonGroup>
              </div>
            </div>

            {/* Changes indicator */}
            {hasChanges && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <Clock1 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <Text
                    size="sm"
                    className="text-amber-700 dark:text-amber-300"
                  >
                    Você tem alterações não salvas. Clique em Salvar
                    Configurações para aplicar.
                  </Text>
                </div>
              </div>
            )}
          </div>
        </form>
      </Card>

      {/* Help Card */}
      <Card className="bg-slate-300 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Text
                size="base"
                className="font-semibold text-slate-900 dark:text-slate-100 mb-2"
              >
                Dicas de Configuração
              </Text>
              <div className="space-y-2">
                <Text size="sm" className="text-slate-600 dark:text-slate-400">
                  • <strong>Antecedência mínima:</strong> Tempo que os alunos
                  devem respeitar antes de agendar
                </Text>
                <Text size="sm" className="text-slate-600 dark:text-slate-400">
                  • <strong>Horizonte de agendamento:</strong> Até quando no
                  futuro podem agendar
                </Text>
                <Text size="sm" className="text-slate-600 dark:text-slate-400">
                  • <strong>Limite de aulas avulsas:</strong> Controle sua
                  disponibilidade diária
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
