"use client";

import {
  Sparkles,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { GeminiUsageData } from "@/services/admin/geminiApiKeyUsageService";
import UsageWidgetCard, { WidgetStatus } from "./UsageWidgetCard";

interface GeminiUsageWidgetProps {
  data: GeminiUsageData;
}

export default function GeminiUsageWidget({ data }: GeminiUsageWidgetProps) {
  const t = useTranslations("AdminDashboard.gemini");

  let widgetStatus: WidgetStatus = "connected";
  let statusText = "Operational";

  switch (data.status) {
    case "active":
      widgetStatus = "connected";
      statusText = "Operational";
      break;
    case "quota_exceeded":
      widgetStatus = "warning";
      statusText = "Rate Limited";
      break;
    case "missing_key":
      widgetStatus = "error";
      statusText = "No Key";
      break;
    default:
      widgetStatus = "error";
      statusText = "Error";
  }

  return (
    <UsageWidgetCard
      title="Google Gemini"
      subtitle="AI & LLM Service"
      icon={<Sparkles className="w-5 h-5" />}
      status={widgetStatus}
      statusText={statusText}
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span>Modelo: {data.model || "gemini-pro"}</span>
          </div>
        </div>
      }
    >
      {data.status === "missing_key" ? (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200 flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            API Key not configured in environment variables.
          </p>
        </div>
      ) : data.status === "error" ? (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200 flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {data.error || "Failed to connect to Google AI"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 rounded-lg bg-card border border-border/50">
            <span className="text-sm text-muted-foreground block mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Response Time
            </span>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-bold ${
                (data.latency || 0) > 1000 ? "text-amber-500" : "text-emerald-500"
              }`}>
                {data.latency || 0}ms
              </span>
              <span className="text-sm text-muted-foreground mb-1">avg</span>
            </div>
          </div>
        </div>
      )}
    </UsageWidgetCard>
  );
}
