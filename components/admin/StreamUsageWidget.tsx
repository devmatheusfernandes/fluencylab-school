"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MessageSquare,
  Video,
  Users,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { StreamUsageData } from "@/services/admin/streamUsageService";

interface StreamWidgetProps {
  data: StreamUsageData;
}

export default function StreamUsageWidget({ data }: StreamWidgetProps) {
  // Limites do Plano Gratuito (Exemplo - Ajuste conforme seu plano)
  const LIMITS = {
    chat: {
      mau: 2000,
      concurrent: 100,
    },
    video: {
      minutes: 10000, // Exemplo arbitrário
    },
  };

  const getPercentage = (val: number, max: number) =>
    Math.min(100, (val / max) * 100);

  if (data.status === "error") {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Erro ao conectar com Stream</span>
        </div>
        <p className="text-xs text-red-600 mt-2">{data.error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-none shadow-sm bg-background/60 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold">Stream.io Status</h3>
            <p className="text-sm text-muted-foreground">Chat & Vídeo</p>
          </div>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Online
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LADO DO CHAT */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
            <MessageSquare className="w-4 h-4" /> CHAT
          </div>

          {/* MAU */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                MAU (Ativos Mensais)
              </span>
              <span className="font-bold">
                {data.chat.mau}{" "}
                <span className="text-muted-foreground font-normal">
                  / {LIMITS.chat.mau}
                </span>
              </span>
            </div>
            <Progress
              value={getPercentage(data.chat.mau, LIMITS.chat.mau)}
              className="h-2"
            />
          </div>

          {/* Dados Extras Chat */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="p-3 bg-secondary/30 rounded-lg border">
              <span className="text-xs text-muted-foreground block">
                Conexões
              </span>
              <span className="text-lg font-bold">
                {data.chat.concurrentConnections}
              </span>
            </div>
            <div className="p-3 bg-secondary/30 rounded-lg border">
              <span className="text-xs text-muted-foreground block">
                Canais
              </span>
              <span className="text-lg font-bold">
                {data.chat.totalChannels || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* LADO DO VIDEO */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
            <Video className="w-4 h-4" /> VÍDEO & AUDIO
          </div>

          {/* Minutos */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Minutos Consumidos</span>
              <span className="font-bold">
                {data.video.totalMinutes}{" "}
                <span className="text-xs text-muted-foreground">min</span>
              </span>
            </div>
            <Progress
              value={getPercentage(
                data.video.totalMinutes,
                LIMITS.video.minutes,
              )}
              className="h-2 bg-secondary"
              indicatorClassName="bg-purple-500"
            />
          </div>

          {/* Dados Extras Video */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="p-3 bg-secondary/30 rounded-lg border">
              <span className="text-xs text-muted-foreground block">
                Chamadas Totais
              </span>
              <span className="text-lg font-bold">{data.video.totalCalls}</span>
            </div>
            <div
              className={`p-3 rounded-lg border ${data.video.activeCalls > 0 ? "bg-green-50 border-green-200" : "bg-secondary/30"}`}
            >
              <span className="text-xs text-muted-foreground block">
                Em Andamento
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg font-bold ${data.video.activeCalls > 0 ? "text-green-700" : ""}`}
                >
                  {data.video.activeCalls}
                </span>
                {data.video.activeCalls > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
