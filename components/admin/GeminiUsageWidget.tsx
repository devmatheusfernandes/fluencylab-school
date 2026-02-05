"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, // Ícone mais adequado para AI
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Zap,
  Activity,
  Clock,
} from "lucide-react";
// Assumindo que você adicionará as chaves de tradução ou pode remover o hook e usar strings diretas
import { useTranslations } from "next-intl";
import { GeminiUsageData } from "@/services/admin/geminiApiKeyUsageService"; // Ajuste o import conforme sua estrutura
import { cn } from "@/lib/utils";

interface GeminiUsageWidgetProps {
  data: GeminiUsageData;
}

export default function GeminiUsageWidget({ data }: GeminiUsageWidgetProps) {
  // Se não tiver as traduções ainda, troque por strings fixas
  const t = useTranslations("AdminDashboard.gemini");

  const getStatusBadge = () => {
    switch (data.status) {
      case "active":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Operational</span>
            </div>
          </Badge>
        );
      case "quota_exceeded":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <span>Rate Limited</span>
            </div>
          </Badge>
        );
      case "missing_key":
        return (
          <Badge variant="outline" className="border-dashed">
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>No Key</span>
            </div>
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive">
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Error</span>
            </div>
          </Badge>
        );
    }
  };

  const renderContent = () => {
    if (data.status === "missing_key") {
      return (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200 flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            API Key not configured in environment variables.
          </p>
        </div>
      );
    }

    if (data.status === "error") {
      return (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200 flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {data.error || "Failed to connect to Google AI"}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Latency Card */}
        <div className="p-4 rounded-lg bg-card border border-border/50">
          <span className="text-sm text-muted-foreground block mb-1 flex items-center gap-2">
            <Clock className="w-3 h-3" /> Response Time
          </span>
          <div className="flex items-end gap-2">
            <span
              className={cn(
                "text-2xl font-bold",
                (data.latency || 0) < 500
                  ? "text-emerald-600 dark:text-emerald-400"
                  : (data.latency || 0) < 1500
                    ? "text-amber-600"
                    : "text-red-600",
              )}
            >
              {data.latency ?? "-"}
            </span>
            <span className="text-sm text-muted-foreground mb-1">ms</span>
          </div>
        </div>

        {/* Model Info Card */}
        <div className="p-4 rounded-lg bg-card border border-border/50">
          <span className="text-sm text-muted-foreground block mb-1 flex items-center gap-2">
            <Zap className="w-3 h-3" /> Model Checked
          </span>
          <div className="flex items-end gap-2">
            <span className="text-lg font-bold truncate">{data.model}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 border-none shadow-sm bg-background/60 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            {/* Ícone do Gemini/AI */}
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Gemini API</h3>
            <p className="text-sm text-muted-foreground">
              Status & Connectivity
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {renderContent()}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Manage Keys</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </Button>
      </div>
    </Card>
  );
}
