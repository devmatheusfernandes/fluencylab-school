"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Mic,
  Activity,
  CheckCircle2,
  AlertCircle,
  Type,
  CalendarClock,
  Zap,
} from "lucide-react";
import { format } from "date-fns"; // Recomendo usar date-fns para formatar a data, ou use Intl nativo
import { ptBR } from "date-fns/locale";
import type { ElevenLabsUsageData } from "@/services/admin/elevenLabsUsageService";

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

  if (data.status === "error") {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Erro na conexão ElevenLabs</span>
        </div>
        <p className="text-xs text-red-600 mt-2">{data.error}</p>
      </Card>
    );
  }

  const { subscription, voices } = data;
  const usagePercentage = getPercentage(
    subscription.characterCount,
    subscription.characterLimit,
  );

  return (
    <Card className="p-6 border-none shadow-sm bg-background/60 backdrop-blur-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <Activity className="w-5 h-5 text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <h3 className="font-semibold">ElevenLabs TTS</h3>
            <p className="text-sm text-muted-foreground capitalize">
              Plano: {subscription.tier}
            </p>
          </div>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Online
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LADO ESQUERDO: Caracteres (Principal Métrica) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
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
              // Muda a cor se estiver perto do limite (ex: > 90%)
              indicatorClassName={
                usagePercentage > 90
                  ? "bg-red-500"
                  : "bg-slate-900 dark:bg-slate-100"
              }
            />
          </div>

          {/* Dados Extras de Caracteres */}
          <div className="grid grid-cols-1 gap-2 mt-4">
            <div className="p-3 bg-secondary/30 rounded-lg border flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">
                  Próximo Reset
                </span>
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">
                    {formatDate(subscription.nextResetDate)}
                  </span>
                </div>
              </div>
              {subscription.canExtendLimit && (
                <Badge
                  variant="outline"
                  className="border-blue-200 text-blue-700 bg-blue-50"
                >
                  <Zap className="w-3 h-3 mr-1 fill-blue-700" />
                  Extensível
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* LADO DIREITO: Vozes e Status */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
            <Mic className="w-4 h-4" /> VOZES & LIMITES
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Limite de Vozes */}
            <div className="p-3 bg-secondary/30 rounded-lg border">
              <span className="text-xs text-muted-foreground block">
                Limite de Vozes
              </span>
              <div className="mt-1">
                <span className="text-2xl font-bold">{voices.limit}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  slots
                </span>
              </div>
            </div>

            {/* Crédito Restante (Cálculo Rápido) */}
            <div className="p-3 bg-secondary/30 rounded-lg border">
              <span className="text-xs text-muted-foreground block">
                Restante
              </span>
              <div className="mt-1">
                <span className="text-lg font-bold text-emerald-600">
                  {(100 - usagePercentage).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/30">
            <p className="text-xs text-orange-800 dark:text-orange-300">
              <strong>Nota:</strong> O endpoint <code>subscription</code>{" "}
              retorna o uso acumulado até o reset. Para histórico diário
              detalhado, consulte a aba de Analytics.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
