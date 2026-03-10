"use client";

import { Progress } from "@/components/ui/progress";
import {
  MessageSquare,
  Activity,
  AlertCircle,
  Video,
  Users,
} from "lucide-react";
import type { StreamUsageData } from "@/services/admin/streamUsageService";
import UsageWidgetCard, { WidgetStatus } from "./UsageWidgetCard";

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

  const widgetStatus: WidgetStatus = data.status === "error" ? "error" : "connected";

  if (data.status === "error") {
    return (
      <UsageWidgetCard
        title="Stream.io"
        subtitle="Chat & Video Infrastructure"
        icon={<Activity className="w-5 h-5" />}
        status="error"
        statusText="Connection Error"
      >
        <div className="flex items-center gap-2 text-destructive mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Erro ao conectar com Stream</span>
        </div>
        <p className="text-sm text-muted-foreground">{data.error}</p>
      </UsageWidgetCard>
    );
  }

  return (
    <UsageWidgetCard
      title="Stream.io"
      subtitle="Chat & Video Infrastructure"
      icon={<Activity className="w-5 h-5" />}
      status="connected"
      statusText="Online"
      footer={
        <div className="flex justify-between items-center w-full">
           <div className="flex items-center gap-2">
             <Video className="w-4 h-4 text-muted-foreground" />
             <span>{data.video.totalCalls} chamadas</span>
           </div>
           <span>{data.video.totalMinutes} min totais</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* LADO DO CHAT */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
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
                <span className="text-muted-foreground font-normal text-xs">
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
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-secondary/30 rounded-lg border border-border/50">
              <span className="text-xs text-muted-foreground block mb-1">
                Conexões Ativas
              </span>
              <span className="text-lg font-bold">
                {data.chat.concurrentConnections}
              </span>
            </div>
            <div className="p-3 bg-secondary/30 rounded-lg border border-border/50">
              <span className="text-xs text-muted-foreground block mb-1">
                Canais Totais
              </span>
              <span className="text-lg font-bold">
                {data.chat.totalChannels}
              </span>
            </div>
          </div>
        </div>
      </div>
    </UsageWidgetCard>
  );
}
