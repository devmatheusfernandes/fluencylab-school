"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Flame,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  CalendarDays,
  Server,
  ShieldCheck,
  HardDrive,
  Activity,
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
    if (periodLabel === "30d") return "30 dias";

    const [year, month] = periodLabel.split("-").map(Number);
    if (!isNaN(year) && !isNaN(month)) {
      const date = new Date(year, month - 1);
      return date.toLocaleString("pt-BR", { month: "long", year: "numeric" });
    }
    return "30 dias";
  };

  const getLastMonths = () => {
    const months = [];
    const date = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      months.push({ value, label });
    }
    return months;
  };

  const lastMonths = getLastMonths();

  const renderContent = () => {
    if (data.status === "no_permission") {
      return (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200 flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {t("permissionError")}
          </p>
          <div className="mt-4 opacity-50 pointer-events-none filter grayscale">
            <span className="text-xs">
              Dados limitados devido à permissão...
            </span>
          </div>
        </div>
      );
    }

    // Caso: Erro Genérico
    if (data.status === "error") {
      return (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200 flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {t("genericError")}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Banner de Custo Estimado */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border border-orange-100 dark:border-orange-900/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-black/20 rounded-full">
              <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-orange-800 dark:text-orange-300 font-medium uppercase tracking-wider">
                {t("estimatedCost")}
              </p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {calculateEstimatedCost()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">
              {t("planType")}
            </span>
            <Badge
              variant="outline"
              className="bg-white/50 dark:bg-black/20 border-orange-200 text-orange-700"
            >
              Blaze
            </Badge>
          </div>
        </div>

        {/* SEÇÃO 1: BANCO DE DADOS (Firestore) */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Banco de Dados
          </h4>

          {/* Reads */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-sm font-medium text-muted-foreground block mb-1">
                  Reads
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">
                    {formatNumber(data.reads)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {formatNumber(FREE_TIER_READS)}
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs font-normal">
                {getPercentage(data.reads, FREE_TIER_READS).toFixed(1)}% da cota
              </Badge>
            </div>
            <Progress
              value={getPercentage(data.reads, FREE_TIER_READS)}
              className="h-2.5 bg-secondary"
              indicatorClassName={
                getPercentage(data.reads, FREE_TIER_READS) > 90
                  ? "bg-destructive"
                  : getPercentage(data.reads, FREE_TIER_READS) > 75
                    ? "bg-amber-500"
                    : "bg-primary"
              }
            />
          </div>

          {/* Writes */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-sm font-medium text-muted-foreground block mb-1">
                  Writes
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">
                    {formatNumber(data.writes)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {formatNumber(FREE_TIER_WRITES)}
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs font-normal">
                {getPercentage(data.writes, FREE_TIER_WRITES).toFixed(1)}% da
                cota
              </Badge>
            </div>
            <Progress
              value={getPercentage(data.writes, FREE_TIER_WRITES)}
              className="h-2.5 bg-secondary"
            />
          </div>

          {/* Deletes */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-sm font-medium text-muted-foreground block mb-1">
                  Deletes
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">
                    {formatNumber(data.deletes)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {formatNumber(FREE_TIER_DELETES)}
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs font-normal">
                {getPercentage(data.deletes, FREE_TIER_DELETES).toFixed(1)}% da
                cota
              </Badge>
            </div>
            <Progress
              value={getPercentage(data.deletes, FREE_TIER_DELETES)}
              className="h-2.5 bg-secondary"
            />
          </div>
        </div>

        {/* Grid para Métricas Secundárias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SEÇÃO 2: STORAGE & BANDWIDTH */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-3 h-3" /> Storage & Bandwidth
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                <span className="text-xs font-medium text-muted-foreground block mb-1">
                  Armazenado
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold">
                    {(data.storageBytes / (1024 * 1024 * 1024)).toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">GB</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                <span className="text-xs font-medium text-muted-foreground block mb-1">
                  Download (Egress)
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold">
                    {data.bandwidthGB.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">GB</span>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: COMPUTE & AUTH */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3 h-3" /> Compute & Auth
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Cloud Functions */}
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                <span className="text-xs font-medium text-muted-foreground block mb-1">
                  Functions Invokes
                </span>
                <div className="flex flex-col">
                  <span className="text-xl font-bold">
                    {formatNumber(data.cloudFunctionsInvokes)}
                  </span>
                  {data.cloudFunctionsErrors > 0 && (
                    <span className="text-xs text-destructive font-medium mt-1">
                      {formatNumber(data.cloudFunctionsErrors)} erros
                    </span>
                  )}
                </div>
              </div>

              {/* Auth & App Engine */}
              <div className="space-y-3">
                {/* Token Verifications */}
                <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Auth Checks
                    </span>
                  </div>
                  <span className="text-sm font-bold">
                    {formatNumber(data.tokenVerifications)}
                  </span>
                </div>

                {/* App Engine Warning */}
                <div
                  className={`flex justify-between items-center p-2 rounded-lg border ${
                    data.appEngineInstances > 0
                      ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                      : "bg-secondary/30 border-border/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Server
                      className={`w-4 h-4 ${
                        data.appEngineInstances > 0
                          ? "text-amber-600"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        data.appEngineInstances > 0
                          ? "text-amber-700 dark:text-amber-300"
                          : "text-muted-foreground"
                      }`}
                    >
                      App Engine
                    </span>
                  </div>
                  <span className="text-sm font-bold">
                    {data.appEngineInstances} inst.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 border-none shadow-sm bg-background/60 backdrop-blur-sm">
      {/* Cabeçalho do Widget */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t("title")}</h3>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Menu Dropdown de Período */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 min-w-[140px] justify-between capitalize"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>{getPeriodText()}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Recentes
              </div>
              <DropdownMenuItem onClick={() => handlePeriodChange("24h")}>
                Últimas 24h
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePeriodChange("7d")}>
                Últimos 7 dias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePeriodChange("30d")}>
                Últimos 30 dias
              </DropdownMenuItem>

              <div className="border-t my-1" />
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Mensal
              </div>
              {lastMonths.map((month) => (
                <DropdownMenuItem
                  key={month.value}
                  onClick={() => handlePeriodChange(month.value)}
                  className="capitalize"
                >
                  {month.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Badge de Status */}
          {data.status === "connected" && (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span className="hidden sm:inline">
                  {t("status.connected")}
                </span>
              </div>
            </Badge>
          )}
        </div>
      </div>

      {/* Conteúdo Principal */}
      {renderContent()}

      {/* Rodapé com Link */}
      <div className="flex justify-end mt-6">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <a
            href={`https://console.cloud.google.com/billing`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{t("viewBilling")}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </Button>
      </div>
    </Card>
  );
}
