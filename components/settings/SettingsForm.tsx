"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import TwoFactorSetup from "./TwoFactorSetup";
import { GoogleCalendarDefaultTimes } from "@/types/users/users";
import { ThemeSwitcher } from "../ThemeSwitcher";
import { 
  Palette, 
  Globe, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Clock,
} from "lucide-react";

interface SettingsFormProps {
  currentLanguage: string;
  currentTheme: "light" | "dark";
  currentThemeColor?: "violet" | "rose" | "orange" | "yellow" | "green";
  googleCalendarConnected?: boolean;
  googleCalendarDefaultTimes?: GoogleCalendarDefaultTimes;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24
    }
  }
};

export default function SettingsForm({
  currentLanguage,
  currentThemeColor,
  googleCalendarConnected = false,
  googleCalendarDefaultTimes = {},
}: SettingsFormProps) {
  const [language, setLanguage] = useState(currentLanguage);
  const [themeColor, setThemeColor] = useState<
    "violet" | "rose" | "orange" | "yellow" | "green"
  >(currentThemeColor || "violet");
  const [defaultTimes, setDefaultTimes] = useState<GoogleCalendarDefaultTimes>(
    googleCalendarDefaultTimes || {}
  );
  const { updateSettings } = useSettings();

  const applyThemeColorClass = (color: typeof themeColor) => {
    const root = document.documentElement;
    root.classList.remove(
      "theme-violet",
      "theme-rose",
      "theme-orange",
      "theme-yellow",
      "theme-green"
    );
    root.classList.add(`theme-${color}`);
  };

  useEffect(() => {
    applyThemeColorClass(themeColor);
  }, []);

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

  const themeColors = [
    { value: "violet", label: "Violeta", color: "bg-purple-500" },
    { value: "rose", label: "Rosa", color: "bg-rose-500" },
    { value: "orange", label: "Laranja", color: "bg-orange-500" },
    { value: "yellow", label: "Amarelo", color: "bg-yellow-500" },
    { value: "green", label: "Verde", color: "bg-green-500" },
  ];

  return (
    <motion.div 
      className="p-4 md:p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Interface Settings */}
      <motion.div variants={itemVariants}>
        <Card className="card-base p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Text variant="subtitle" size="lg" weight="semibold">
                Interface
              </Text>
              <Text size="sm" variant="placeholder">
                Personalize a aparência do sistema
              </Text>
            </div>
          </div>

          <div className="space-y-4">
            <motion.div 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg subcontainer-base"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <label htmlFor="language" className="font-medium">Idioma</label>
              </div>
              <Select
                value={language}
                onValueChange={(v) => {
                  setLanguage(v);
                  updateSettings({ interfaceLanguage: v });
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            <motion.div 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg subcontainer-base"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <label htmlFor="themeColor" className="font-medium">Cor do Tema</label>
              </div>
              <Select
                value={themeColor}
                onValueChange={(v) => {
                  const c = v as typeof themeColor;
                  setThemeColor(c);
                  applyThemeColorClass(c);
                  updateSettings({ themeColor: c });
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themeColors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color.color}`} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            <motion.div 
              className="flex items-center justify-between p-4 rounded-lg subcontainer-base"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <label htmlFor="theme" className="font-medium">Tema</label>
              <ThemeSwitcher />
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* Google Calendar Settings */}
      <motion.div variants={itemVariants}>
        <Card className="card-base p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Text variant="subtitle" size="lg" weight="semibold">
                Calendário Google
              </Text>
              <Text size="sm" variant="placeholder">
                Sincronize suas tarefas com o Google Calendar
              </Text>
            </div>
          </div>

          <div className="space-y-4">
            <Alert className={googleCalendarConnected 
              ? "border-green-500/50 dark:border-green-400/50" 
              : "border-slate-200/50 dark:border-slate-700/50"
            }>
              {googleCalendarConnected ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <Text weight="medium" className={googleCalendarConnected ? "text-green-700 dark:text-green-300" : ""}>
                      {googleCalendarConnected
                        ? "Conta conectada com sucesso"
                        : "Conecte sua conta do Google Calendar"}
                    </Text>
                    {!googleCalendarConnected && (
                      <Text size="sm" variant="placeholder" className="mt-1">
                        Sincronize tarefas automaticamente
                      </Text>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {googleCalendarConnected ? (
                      <>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              fetch("/api/student/google-calendar/disconnect", {
                                method: "POST",
                              }).then(() => {
                                window.location.reload();
                              });
                            }}
                          >
                            Desconectar
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button size="sm" onClick={handleConnectGoogleCalendar}>
                            Reconectar
                          </Button>
                        </motion.div>
                      </>
                    ) : (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button size="sm" onClick={handleConnectGoogleCalendar}>
                          Conectar
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {googleCalendarConnected && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4 pt-2"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Text weight="medium">Horários padrão para sincronização</Text>
                </div>
                <div className="space-y-3">
                  {dayNames.map(({ key, label }) => (
                    <motion.div
                      key={key}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg subcontainer-base"
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <label className="w-full sm:w-32 font-medium text-sm">{label}</label>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={
                            defaultTimes[key as keyof GoogleCalendarDefaultTimes]
                              ?.startTime || "09:00"
                          }
                          onChange={(e) =>
                            handleTimeChange(key, "startTime", e.target.value)
                          }
                          className="flex-1 sm:w-auto"
                        />
                        <span className="text-sm text-muted-foreground">até</span>
                        <Input
                          type="time"
                          value={
                            defaultTimes[key as keyof GoogleCalendarDefaultTimes]
                              ?.endTime || "10:00"
                          }
                          onChange={(e) =>
                            handleTimeChange(key, "endTime", e.target.value)
                          }
                          className="flex-1 sm:w-auto"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Two Factor Authentication */}
      <motion.div variants={itemVariants}>
        <TwoFactorSetup />
      </motion.div>
    </motion.div>
  );
}
