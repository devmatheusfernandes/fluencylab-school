"use client";

import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import TwoFactorSetup from "./TwoFactorSetup";
import { GoogleCalendarDefaultTimes } from "@/types/users/users";
import { SubContainer } from "@/components/ui/sub-container";
import { Spinner } from "../ui/spinner";

interface SettingsFormProps {
  currentLanguage: string;
  currentTheme: "light" | "dark";
  googleCalendarConnected?: boolean;
  googleCalendarDefaultTimes?: GoogleCalendarDefaultTimes;
}

export default function SettingsForm({
  currentLanguage,
  googleCalendarConnected = false,
  googleCalendarDefaultTimes = {},
}: SettingsFormProps) {
  const [language, setLanguage] = useState(currentLanguage);
  const [defaultTimes, setDefaultTimes] = useState<GoogleCalendarDefaultTimes>(
    googleCalendarDefaultTimes || {}
  );
  const { updateSettings, isLoading } = useSettings();

  const handleConnectGoogleCalendar = () => {
    window.location.href = "/api/student/google-calendar/connect";
  };

  const handleTimeChange = (
    day: string,
    timeType: "startTime" | "endTime",
    value: string
  ) => {
    setDefaultTimes((prev) => ({
      ...prev,
      [day]: {
        ...prev[day as keyof GoogleCalendarDefaultTimes],
        [timeType]: value,
      },
    }));
  };

  const dayNames = [
    { key: "monday", label: "Segunda-feira" },
    { key: "tuesday", label: "Terça-feira" },
    { key: "wednesday", label: "Quarta-feira" },
    { key: "thursday", label: "Quinta-feira" },
    { key: "friday", label: "Sexta-feira" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
  ];

  return (
    <div className="p-3">
      <Card>
        <Text variant="subtitle" size="lg" weight="semibold">
          Interface
        </Text>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="language">Idioma</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="theme">Tema Escuro</label>
            {/* <Switch
              id="theme"
              checked={isDark}
              onCheckedChange={(checked) => setTheme(checked)}
            /> */}
          </div>
        </div>

        <div className="flex flex-row justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Spinner /> : "Salvar Configurações"}
          </Button>
        </div>
      </Card>

      <div className="border rounded-full border-t border-card/80 my-4" />

      <Card>
        <Text variant="subtitle" size="lg" weight="semibold">
          Calendário Google
        </Text>
        <div className="mt-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <Text weight="medium">Conexão com Google Calendar</Text>
              <Text
                size="sm"
                variant="placeholder"
                className={
                  googleCalendarConnected ? "text-success font-bold" : ""
                }
              >
                {googleCalendarConnected
                  ? "Conta conectada com sucesso"
                  : "Conecte sua conta do Google Calendar para sincronizar tarefas"}
              </Text>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {googleCalendarConnected ? (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      // Disconnect Google Calendar
                      fetch("/api/student/google-calendar/disconnect", {
                        method: "POST",
                      }).then(() => {
                        window.location.reload();
                      });
                    }}
                  >
                    Desconectar
                  </Button>
                  <Button onClick={handleConnectGoogleCalendar}>
                    Reconectar
                  </Button>
                </>
              ) : (
                <Button onClick={handleConnectGoogleCalendar}>Conectar</Button>
              )}
            </div>
          </div>

          {googleCalendarConnected && (
            <div className="mt-6">
              <Text weight="medium" className="mb-4">
                Horários padrão para sincronização
              </Text>
              <div className="space-y-4">
                {dayNames.map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4"
                  >
                    <label className="w-32">{label}</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={
                          defaultTimes[key as keyof GoogleCalendarDefaultTimes]
                            ?.startTime || "09:00"
                        }
                        onChange={(e) =>
                          handleTimeChange(key, "startTime", e.target.value)
                        }
                        className="w-24"
                      />
                      <span>até</span>
                      <Input
                        type="time"
                        value={
                          defaultTimes[key as keyof GoogleCalendarDefaultTimes]
                            ?.endTime || "10:00"
                        }
                        onChange={(e) =>
                          handleTimeChange(key, "endTime", e.target.value)
                        }
                        className="w-24"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {googleCalendarConnected && (
            <div className="mt-6">
              <Text weight="medium" className="mb-4">
                Horários padrão para sincronização
              </Text>
              <div className="space-y-4">
                {dayNames.map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4"
                  >
                    <label className="w-32">{label}</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={
                          defaultTimes[key as keyof GoogleCalendarDefaultTimes]
                            ?.startTime || "09:00"
                        }
                        onChange={(e) =>
                          handleTimeChange(key, "startTime", e.target.value)
                        }
                        className="w-24"
                      />
                      <span>até</span>
                      <Input
                        type="time"
                        value={
                          defaultTimes[key as keyof GoogleCalendarDefaultTimes]
                            ?.endTime || "10:00"
                        }
                        onChange={(e) =>
                          handleTimeChange(key, "endTime", e.target.value)
                        }
                        className="w-24"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="border rounded-full border-t border-card/80 my-4" />

      <TwoFactorSetup />

      <div className="border rounded-full border-t border-card/80 my-4" />

      <Card className="hidden">
        <Text
          variant="subtitle"
          size="lg"
          weight="semibold"
          className="text-danger"
        >
          Zona de Perigo
        </Text>
        <div className="mt-4 p-4 border border-danger/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Text weight="medium">Desativar Conta</Text>
              <Text size="sm" variant="placeholder">
                Esta ação não pode ser desfeita.
              </Text>
            </div>
            <Button variant="destructive">Desativar</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
