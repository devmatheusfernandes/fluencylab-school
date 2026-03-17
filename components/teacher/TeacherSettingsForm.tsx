"use client";

import { useTeacher } from "@/hooks/teacher/useTeacher";
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
  Info,
} from "lucide-react";
import { ButtonGroup, ButtonGroupSeparator } from "../ui/button-group";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("TeacherSchedule.Settings");
  const [settings, setSettings] = useState(currentSettings);
  const { updateSettings, isLoading, error, successMessage } = useTeacher();

  const settingFields: SettingField[] = [
    {
      key: "bookingLeadTimeHours",
      label: t("form.bookingLeadTimeHours.label"),
      description: t("form.bookingLeadTimeHours.description"),
      placeholder: "24",
      defaultValue: 24,
      icon: <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      unit: t("form.bookingLeadTimeHours.unit"),
      min: 1,
      max: 168,
    },
    {
      key: "bookingHorizonDays",
      label: t("form.bookingHorizonDays.label"),
      description: t("form.bookingHorizonDays.description"),
      placeholder: "30",
      defaultValue: 30,
      icon: (
        <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      ),
      unit: t("form.bookingHorizonDays.unit"),
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
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {successMessage && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/50">
                <div className="flex items-center gap-3">
                  <CheckCheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <Text
                    size="sm"
                    className="font-medium text-emerald-800 dark:text-emerald-300"
                  >
                    {successMessage}
                  </Text>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800/50">
                <div className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <Text
                    size="sm"
                    className="font-medium text-red-800 dark:text-red-300"
                  >
                    {error}
                  </Text>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {settingFields.map((field) => {
                const currentValue = settings?.[field.key];
                const isDefault =
                  currentValue === field.defaultValue ||
                  (!currentValue && field.defaultValue === 0);

                return (
                  <div
                    key={field.key}
                    className="space-y-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                        {field.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Text
                            size="base"
                            className="font-semibold text-slate-900 dark:text-slate-100"
                          >
                            {field.label}
                          </Text>
                          {isDefault && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] uppercase tracking-wider font-bold rounded-md">
                              {t("form.defaultBadge")}
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

                    <div className="space-y-2 mt-auto pt-2">
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
                          className="pr-16 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 h-11"
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

                      {field.min !== undefined && field.max !== undefined && (
                        <div className="flex justify-between px-1">
                          <Text
                            size="xs"
                            className="text-slate-400 dark:text-slate-500"
                          >
                            {t("form.min", { value: field.min })}
                          </Text>
                          <Text
                            size="xs"
                            className="text-slate-400 dark:text-slate-500"
                          >
                            {t("form.max", { value: field.max })}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {hasChanges && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/50">
                <div className="flex items-center gap-3">
                  <Clock1 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <Text
                    size="sm"
                    className="font-medium text-amber-800 dark:text-amber-300"
                  >
                    {t("unsavedChanges")}
                  </Text>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={resetToDefaults}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("buttons.restoreDefaults")}
            </Button>

            <div className="w-full sm:w-auto">
              <ButtonGroup className="w-full sm:w-auto flex">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!hasChanges}
                  className="flex-1 sm:flex-none"
                >
                  {t("buttons.cancel")}
                </Button>
                <ButtonGroupSeparator />
                <Button
                  type="submit"
                  disabled={isLoading || !hasChanges}
                  className="flex-1 sm:flex-none min-w-[120px]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t("buttons.saving")}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 justify-center">
                      <Settings className="w-4 h-4" />
                      {t("buttons.save")}
                    </div>
                  )}
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </form>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <Text
                size="base"
                className="font-bold text-blue-900 dark:text-blue-100 mb-3"
              >
                {t("tips.title")}
              </Text>
              <div className="space-y-2">
                <Text size="sm" className="text-blue-800 dark:text-blue-200">
                  •{" "}
                  {t.rich("tips.leadTime", {
                    highlight: (chunks) => (
                      <strong className="font-semibold">{chunks}</strong>
                    ),
                  })}
                </Text>
                <Text size="sm" className="text-blue-800 dark:text-blue-200">
                  •{" "}
                  {t.rich("tips.horizon", {
                    highlight: (chunks) => (
                      <strong className="font-semibold">{chunks}</strong>
                    ),
                  })}
                </Text>
                <Text size="sm" className="text-blue-800 dark:text-blue-200">
                  •{" "}
                  {t.rich("tips.dailyLimit", {
                    highlight: (chunks) => (
                      <strong className="font-semibold">{chunks}</strong>
                    ),
                  })}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
