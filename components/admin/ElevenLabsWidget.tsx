"use client";

import { Progress } from "@/components/ui/progress";
import {
  Activity,
  AlertCircle,
  Type,
  CalendarClock,
  Mic,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ElevenLabsUsageData } from "@/services/admin/elevenLabsUsageService";
import UsageWidgetCard, { WidgetStatus } from "./UsageWidgetCard";

interface ElevenLabsWidgetProps {
  data: ElevenLabsUsageData;
}

export default function ElevenLabsUsageWidget({ data }: ElevenLabsWidgetProps) {
  const getPercentage = (val: number, max: number) => {
    if (max === 0) return 100;
    return Math.min(100, (val / max) * 100);
  };

  // Formatação de data segura
  const formatDate = (unixTimestamp: number | null) => {
    if (!unixTimestamp) return "N/A";
    // ElevenLabs retorna unix em segundos, JS usa milissegundos
    return format(new Date(unixTimestamp * 1000), "dd 'de' MMM, HH:mm", {
      locale: ptBR,
    });
  };

  let widgetStatus: WidgetStatus = "connected";
  let statusText = "Online";

  if (data.status === "error") {
    widgetStatus = "error";
    statusText = "Error";
  }

  const subscription = data.subscription;
  const voices = data.voices;
  const usagePercentage = subscription ? getPercentage(
    subscription.characterCount,
    subscription.characterLimit,
  ) : 0;

  return (
    <UsageWidgetCard
      title="ElevenLabs TTS"
      subtitle={`Plano: ${subscription?.tier || "Unknown"}`}
      icon={<Activity className="w-5 h-5" />}
      status={widgetStatus}
      statusText={statusText}
      footer={
        subscription?.nextResetDate ? (
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            <span>Reseta em: {formatDate(subscription.nextResetDate)}</span>
          </div>
        ) : undefined
      }
    >
      {data.status === "error" ? (
        <div className="flex items-center gap-2 text-destructive mb-2">
          <AlertCircle className="w-5 h-5" />
          <div>
            <span className="font-medium block">Erro na conexão ElevenLabs</span>
            <span className="text-xs text-muted-foreground">{data.error}</span>
          </div>
        </div>
      ) : subscription && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Type className="w-4 h-4" /> CARACTERES GERADOS
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uso Mensal</span>
                <span className="font-bold">
                  {subscription.characterCount.toLocaleString("pt-BR")}
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    / {subscription.characterLimit.toLocaleString("pt-BR")}
                  </span>
                </span>
              </div>
              <Progress
                value={usagePercentage}
                className="h-2"
                indicatorClassName={
                  usagePercentage > 90
                    ? "bg-red-500"
                    : usagePercentage > 75
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Mic className="w-4 h-4" /> VOZES & LIMITES
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary/30 rounded-lg border border-border/50">
                <span className="text-xs text-muted-foreground block mb-1">
                  Limite de Vozes
                </span>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-bold">{voices.limit}</span>
                  <span className="text-xs text-muted-foreground mb-1">
                    slots
                  </span>
                </div>
              </div>

              <div className="p-3 bg-secondary/30 rounded-lg border border-border/50">
                <span className="text-xs text-muted-foreground block mb-1">
                  Restante
                </span>
                <div className="flex items-end gap-1">
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {(100 - usagePercentage).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </UsageWidgetCard>
  );
}
