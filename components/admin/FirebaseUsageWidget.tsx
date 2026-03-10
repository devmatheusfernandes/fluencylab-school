"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Flame,
  CalendarDays,
  CreditCard,
  Server,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { FirebaseUsageData } from "@/services/admin/firebaseUsageService";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UsageWidgetCard, { WidgetStatus } from "./UsageWidgetCard";

interface FirebaseUsageWidgetProps {
  data: FirebaseUsageData;
}

export default function FirebaseUsageWidget({
  data,
}: FirebaseUsageWidgetProps) {
  const t = useTranslations("AdminDashboard.firebase");
  const router = useRouter();
  const [periodLabel, setPeriodLabel] = useState<string>("30d");

  let periodDays = 30;
  if (periodLabel === "24h") periodDays = 1;
  else if (periodLabel === "7d") periodDays = 7;
  else if (periodLabel === "30d") periodDays = 30;
  else {
    // Para meses específicos (YYYY-MM)
    const [year, month] = periodLabel.split("-").map(Number);
    if (!isNaN(year) && !isNaN(month)) {
      periodDays = new Date(year, month, 0).getDate();
    }
  }

  // Cota gratuita diária estimada multiplicada pelos dias do período
  const FREE_TIER_READS = 50000 * periodDays;
  const FREE_TIER_WRITES = 20000 * periodDays;
  const FREE_TIER_DELETES = 20000 * periodDays;

  // Taxa de Câmbio estimada (USD -> BRL)
  const BRL_EXCHANGE_RATE = 6.0;

  // Estimativa de Custo (Plano Blaze - Preço aprox. Multi-region US)
  const calculateEstimatedCost = () => {
    const billableReads = Math.max(0, data.reads - FREE_TIER_READS);
    const billableWrites = Math.max(0, data.writes - FREE_TIER_WRITES);
    const billableDeletes = Math.max(0, data.deletes - FREE_TIER_DELETES);

    const costReadsUSD = (billableReads / 100000) * 0.06;
    const costWritesUSD = (billableWrites / 100000) * 0.18;
    const costDeletesUSD = (billableDeletes / 100000) * 0.02;

    const totalUSD = costReadsUSD + costWritesUSD + costDeletesUSD;
    const totalBRL = totalUSD * BRL_EXCHANGE_RATE;

    return totalBRL.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // --- Helpers de Formatação ---

  const getPercentage = (current: number, max: number) => {
    if (max === 0) return 0;
    return Math.min(100, (current / max) * 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(num);
  };

  const handlePeriodChange = (range: string) => {
    setPeriodLabel(range);
    const url = new URL(window.location.href);
    url.searchParams.set("firebase_period", range);
    router.replace(url.toString());
    router.refresh();
  };

  const getPeriodText = () => {
    if (periodLabel === "24h") return "Últimas 24h";
    if (periodLabel === "7d") return "Últimos 7 dias";
    if (periodLabel === "30d") return "Últimos 30 dias";
    return periodLabel;
  };

  // Mapeamento de status
  let widgetStatus: WidgetStatus = "connected";
  if (data.status === "error") widgetStatus = "error";
  if (data.status === "no_permission") widgetStatus = "restricted";

  return (
    <UsageWidgetCard
      title="Firebase Firestore"
      subtitle="Database Usage & Costs"
      icon={<Flame className="w-5 h-5" />}
      status={widgetStatus}
      statusText={data.error}
      action={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {getPeriodText()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handlePeriodChange("24h")}>
              Últimas 24h
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePeriodChange("7d")}>
              Últimos 7 dias
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePeriodChange("30d")}>
              Últimos 30 dias
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span>Custo Estimado (Blaze):</span>
            <span className="font-medium text-foreground">
              {calculateEstimatedCost()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Server className="w-4 h-4" />
            <span>{data.activeConnections} conexões ativas</span>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Reads */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Leituras (Reads)</span>
            <span className="font-medium">
              {formatNumber(data.reads)}{" "}
              <span className="text-muted-foreground font-normal text-xs">
                / {formatNumber(FREE_TIER_READS)} (Free)
              </span>
            </span>
          </div>
          <Progress
            value={getPercentage(data.reads, FREE_TIER_READS)}
            className="h-2"
            indicatorClassName={
              data.reads > FREE_TIER_READS ? "bg-amber-500" : "bg-emerald-500"
            }
          />
        </div>

        {/* Writes */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Escritas (Writes)</span>
            <span className="font-medium">
              {formatNumber(data.writes)}{" "}
              <span className="text-muted-foreground font-normal text-xs">
                / {formatNumber(FREE_TIER_WRITES)} (Free)
              </span>
            </span>
          </div>
          <Progress
            value={getPercentage(data.writes, FREE_TIER_WRITES)}
            className="h-2"
            indicatorClassName={
              data.writes > FREE_TIER_WRITES ? "bg-amber-500" : "bg-blue-500"
            }
          />
        </div>

        {/* Deletes */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Exclusões (Deletes)</span>
            <span className="font-medium">
              {formatNumber(data.deletes)}{" "}
              <span className="text-muted-foreground font-normal text-xs">
                / {formatNumber(FREE_TIER_DELETES)} (Free)
              </span>
            </span>
          </div>
          <Progress
            value={getPercentage(data.deletes, FREE_TIER_DELETES)}
            className="h-2"
            indicatorClassName={
              data.deletes > FREE_TIER_DELETES ? "bg-amber-500" : "bg-rose-500"
            }
          />
        </div>
      </div>
    </UsageWidgetCard>
  );
}
