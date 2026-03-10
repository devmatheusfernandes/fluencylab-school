"use client";

import {
  Mail,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { ResendUsageData } from "@/services/admin/resendUsageService";
import UsageWidgetCard, { WidgetStatus } from "./UsageWidgetCard";

interface ResendUsageWidgetProps {
  data: ResendUsageData;
}

export default function ResendUsageWidget({ data }: ResendUsageWidgetProps) {
  const t = useTranslations("AdminDashboard.resend");

  let widgetStatus: WidgetStatus = "connected";
  if (data.status === "restricted_key") widgetStatus = "restricted";
  else if (data.status === "error" || data.status === "missing_key") widgetStatus = "error";

  // Daily quota is only returned for free plan users (limit 100/day)
  // As the user explicitly stated they are on the Free Plan, we default to showing these limits.
  const isFreePlan = true;

  return (
    <UsageWidgetCard
      title="Resend Email"
      subtitle="Transactional Email API"
      icon={<Mail className="w-5 h-5" />}
      status={widgetStatus}
      statusText={
        data.status === "connected" ? t("status.connected") :
        data.status === "restricted_key" ? t("status.restricted") :
        t("status.error")
      }
    >
      {data.status === "restricted_key" ? (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200 flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {t("restrictedMessage")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {isFreePlan && (
            <div className="p-4 rounded-lg bg-card border border-border/50">
              <span className="text-sm text-muted-foreground block mb-1">
                {t("dailyUsage")}
              </span>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">
                  {data.dailyUsed ?? "0"}
                </span>
                <span className="text-sm text-muted-foreground mb-1">/ 100</span>
              </div>
            </div>
          )}
        </div>
      )}
    </UsageWidgetCard>
  );
}
