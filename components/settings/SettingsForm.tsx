"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useSettings } from "@/hooks/core/useSettings";
import { useContract } from "@/hooks/financial/useContract";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TwoFactorSetup from "./TwoFactorSetup";
import { GoogleCalendarDefaultTimes } from "@/types/users/users";
import { usePWAInstall } from "@/hooks/ui/usePWAInstall";
import { usePWAUpdate } from "@/hooks/ui/usePWAUpdate";
import { ThemeSwitcher } from "../ThemeSwitcher";
import {
  Palette,
  Globe,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  RefreshCw,
  Download,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Header } from "../ui/header";

interface SettingsFormProps {
  currentLanguage: string;
  currentTheme: "light" | "dark";
  currentThemeColor?: "violet" | "rose" | "indigo" | "yellow" | "green";
  googleCalendarConnected?: boolean;
  googleCalendarDefaultTimes?: GoogleCalendarDefaultTimes;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

export default function SettingsForm({
  currentLanguage,
  currentThemeColor,
  googleCalendarConnected = false,
  googleCalendarDefaultTimes = {},
}: SettingsFormProps) {
  const t = useTranslations("Settings");
  const router = useRouter();
  const pathname = usePathname();

  // Get language from URL to ensure UI sync
  const urlLocale = pathname.split("/")[1];
  const initialLanguage = ["pt", "en"].includes(urlLocale)
    ? urlLocale
    : currentLanguage;

  const [language, setLanguage] = useState(initialLanguage);
  const [themeColor, setThemeColor] = useState<
    "violet" | "rose" | "indigo" | "yellow" | "green"
  >(currentThemeColor || "violet");
  const [defaultTimes, setDefaultTimes] = useState<GoogleCalendarDefaultTimes>(
    googleCalendarDefaultTimes || {},
  );
  const { updateSettings } = useSettings();
  const { contractStatus, toggleAutoRenewal } = useContract();
  const [isTogglingRenewal, setIsTogglingRenewal] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const { data: session } = useSession();
  const { isInstallable, install } = usePWAInstall();
  const { needRefresh, updateServiceWorker } = usePWAUpdate();

  const handleToggleAutoRenewal = async (enabled: boolean) => {
    setIsTogglingRenewal(true);
    try {
      const result = await toggleAutoRenewal(enabled);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erro ao alterar renovação automática");
    } finally {
      setIsTogglingRenewal(false);
    }
  };

  const applyThemeColorClass = (color: typeof themeColor) => {
    const root = document.documentElement;
    root.classList.remove(
      "theme-violet",
      "theme-rose",
      "theme-indigo",
      "theme-yellow",
      "theme-green",
    );
    root.classList.add(`theme-${color}`);
  };

  useEffect(() => {
    applyThemeColorClass(themeColor);
  }, []);

  const handleConnectGoogleCalendar = () => {
    window.location.href = "/api/student/google-calendar/connect";
  };

  const handleSetPassword = async () => {
    if (!session?.user?.email) return;
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, session.user.email);
      toast.success(t("security.passwordResetSentDesc"));
    } catch (error) {
      toast.error("Erro ao enviar email de redefinição.");
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleTimeChange = (
    day: string,
    timeType: "startTime" | "endTime",
    value: string,
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
    { key: "monday", label: t("days.monday") },
    { key: "tuesday", label: t("days.tuesday") },
    { key: "wednesday", label: t("days.wednesday") },
    { key: "thursday", label: t("days.thursday") },
    { key: "friday", label: t("days.friday") },
    { key: "saturday", label: t("days.saturday") },
    { key: "sunday", label: t("days.sunday") },
  ];

  const themeColors = [
    {
      value: "violet",
      label: t("interface.colors.violet"),
      color: "bg-purple-500",
    },
    { value: "rose", label: t("interface.colors.rose"), color: "bg-rose-500" },
    {
      value: "indigo",
      label: t("interface.colors.indigo"),
      color: "bg-indigo-500",
    },
    {
      value: "yellow",
      label: t("interface.colors.yellow"),
      color: "bg-yellow-500",
    },
    {
      value: "green",
      label: t("interface.colors.green"),
      color: "bg-green-500",
    },
  ];

  return (
    <motion.div
      className="container-padding space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Header heading={t("header.title")} subheading={t("header.subtitle")} />

      {/* PWA Update */}
      {needRefresh && isInstallable && (
        <motion.div variants={itemVariants}>
          <Card>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10 text-white">
                  <RefreshCw className="h-6 w-6" />
                </div>
                <div>
                  <Text
                    variant="subtitle"
                    size="lg"
                    weight="semibold"
                    className="text-white"
                  >
                    {t("pwaUpdate.title")}
                  </Text>
                  <Text
                    size="sm"
                    variant="placeholder"
                    className="max-w-md text-white/70"
                  >
                    {t("pwaUpdate.description")}
                  </Text>
                </div>
              </div>
              <Button
                onClick={updateServiceWorker}
                className="w-full sm:w-auto shrink-0 bg-white/10 hover:bg-white/20 text-white border-0"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("pwaUpdate.button")}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* PWA Install */}
      {isInstallable && (
        <motion.div variants={itemVariants}>
          <Card className="card-base p-6 border-primary/20 bg-primary/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <Download className="h-6 w-6" />
                </div>
                <div>
                  <Text variant="subtitle" size="lg" weight="semibold">
                    {t("pwa.title")}
                  </Text>
                  <Text size="sm" variant="placeholder" className="max-w-md">
                    {t("pwa.description")}
                  </Text>
                </div>
              </div>
              <Button onClick={install} className="w-full sm:w-auto shrink-0">
                <Download className="mr-2 h-4 w-4" />
                {t("pwa.installButton")}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Interface Settings */}
      <motion.div variants={itemVariants}>
        <Card className="card-base p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Text variant="subtitle" size="lg" weight="semibold">
                {t("interface.title")}
              </Text>
              <Text size="sm" variant="placeholder">
                {t("interface.subtitle")}
              </Text>
            </div>
          </div>

          <div className="space-y-4">
            <motion.div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg item-base"
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <label htmlFor="language" className="font-medium">
                  {t("interface.language")}
                </label>
              </div>
              <Select
                value={language}
                onValueChange={(v) => {
                  setLanguage(v);
                  updateSettings({ interfaceLanguage: v });
                  const segments = pathname.split("/");
                  if (segments.length > 1) {
                    segments[1] = v;
                  }
                  router.push(segments.join("/"));
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">
                    {t("interface.languages.pt")}
                  </SelectItem>
                  <SelectItem value="en">
                    {t("interface.languages.en")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg item-base"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <label htmlFor="themeColor" className="font-medium">
                  {t("interface.themeColor")}
                </label>
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
                        <div
                          className={`w-3 h-3 rounded-full ${color.color}`}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            <motion.div
              className="flex items-center justify-between p-4 rounded-lg item-base"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <label htmlFor="theme" className="font-medium">
                {t("interface.theme")}
              </label>
              <ThemeSwitcher />
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* Contract Settings */}
      {(contractStatus?.signed || contractStatus?.cancelledAt) && (
        <motion.div variants={itemVariants} initial="visible" animate="visible">
          <Card className="card-base p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Text variant="subtitle" size="lg" weight="semibold">
                  {t("contract.title")}
                </Text>
                <Text size="sm" variant="placeholder">
                  {t("contract.subtitle")}
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              <motion.div
                className="flex items-center justify-between p-4 rounded-lg item-base"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label htmlFor="autoRenewal" className="font-medium block">
                      {t("contract.autoRenewal")}
                    </label>
                    <Text size="sm" variant="placeholder">
                      {t("contract.autoRenewalDescription")}
                    </Text>
                  </div>
                </div>
                {contractStatus.cancelledAt ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-not-allowed opacity-50">
                          <Switch checked={false} disabled={true} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("contract.autoRenewalDisabledCancelled")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Switch
                    checked={contractStatus.autoRenewal !== false}
                    onCheckedChange={handleToggleAutoRenewal}
                    disabled={isTogglingRenewal}
                  />
                )}
              </motion.div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Google Calendar Settings */}
      <motion.div variants={itemVariants}>
        <Card className="card-base p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Text variant="subtitle" size="lg" weight="semibold">
                {t("googleCalendar.title")}
              </Text>
              <Text size="sm" variant="placeholder">
                {t("googleCalendar.subtitle")}
              </Text>
            </div>
          </div>

          <div className="space-y-4">
            <motion.div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg item-base"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="flex items-center gap-3">
                {googleCalendarConnected ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <Text
                    weight="medium"
                    className={
                      googleCalendarConnected
                        ? "text-emerald-600 dark:text-emerald-400"
                        : ""
                    }
                  >
                    {googleCalendarConnected
                      ? t("googleCalendar.connected")
                      : t("googleCalendar.connect")}
                  </Text>
                  {!googleCalendarConnected && (
                    <Text size="sm" variant="placeholder">
                      {t("googleCalendar.syncDescription")}
                    </Text>
                  )}
                </div>
              </div>

              <div className="flex gap-2 self-start sm:self-center pt-2 sm:pt-0">
                {googleCalendarConnected ? (
                  <>
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
                      {t("googleCalendar.disconnectButton")}
                    </Button>
                    <Button size="sm" onClick={handleConnectGoogleCalendar}>
                      {t("googleCalendar.reconnectButton")}
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={handleConnectGoogleCalendar}>
                    {t("googleCalendar.connectButton")}
                  </Button>
                )}
              </div>
            </motion.div>

            {googleCalendarConnected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4 pt-2"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Text weight="medium">
                    Horários padrão para sincronização
                  </Text>
                </div>
                <div className="space-y-3">
                  {dayNames.map(({ key, label }) => (
                    <motion.div
                      key={key}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg item-base"
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <label className="w-full sm:w-32 font-medium text-sm">
                        {label}
                      </label>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={
                            defaultTimes[
                              key as keyof GoogleCalendarDefaultTimes
                            ]?.startTime || "09:00"
                          }
                          onChange={(e) =>
                            handleTimeChange(key, "startTime", e.target.value)
                          }
                          className="flex-1 sm:w-auto"
                        />
                        <span className="text-sm text-muted-foreground">
                          {t("googleCalendar.until")}
                        </span>
                        <Input
                          type="time"
                          value={
                            defaultTimes[
                              key as keyof GoogleCalendarDefaultTimes
                            ]?.endTime || "10:00"
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

      {/* Security (Set Password) */}
      {!session?.user?.hasPassword && (
        <motion.div variants={itemVariants}>
          <Card className="card-base p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Text variant="subtitle" size="lg" weight="semibold">
                  {t("security.title")}
                </Text>
                <Text size="sm" variant="placeholder">
                  {t("security.subtitle")}
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg item-base">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <div>
                    <label className="font-medium block">
                      {t("security.noPassword")}
                    </label>
                    <Text size="sm" variant="placeholder">
                      {t("security.setPasswordDesc")}
                    </Text>
                  </div>
                </div>
                <Button onClick={handleSetPassword} disabled={isSendingReset}>
                  {isSendingReset ? "Enviando..." : t("security.setPassword")}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
