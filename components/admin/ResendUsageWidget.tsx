"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Lock,
  Info,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { ResendUsageData } from "@/services/admin/resendUsageService";
import { cn } from "@/lib/utils";

interface ResendUsageWidgetProps {
  data: ResendUsageData;
}

export default function ResendUsageWidget({ data }: ResendUsageWidgetProps) {
  const t = useTranslations("AdminDashboard.resend");

  const getStatusBadge = () => {
    switch (data.status) {
      case "connected":
      case "connected_no_data":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{t("status.connected")}</span>
            </div>
          </Badge>
        );
      case "restricted_key":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>{t("status.restricted")}</span>
            </div>
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive">
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{t("status.error")}</span>
            </div>
          </Badge>
        );
    }
  };

  const renderContent = () => {
    if (data.status === "restricted_key") {
      return (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200 flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {t("restrictedMessage")}
          </p>
        </div>
      );
    }

    // if (data.status === 'connected_no_data') {
    //   return (
    //     <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
    //       <p className="text-sm text-blue-800 dark:text-blue-200 flex gap-2">
    //         <Info className="w-4 h-4 mt-0.5 shrink-0" />
    //         {t("noDataMessage")}
    //       </p>
    //     </div>
    //   );
    // }

    // Daily quota is only returned for free plan users (limit 100/day)
    // As the user explicitly stated they are on the Free Plan, we default to showing these limits.
    const isFreePlan = true;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

        <div
          className={cn(
            "p-4 rounded-lg bg-card border border-border/50",
            !isFreePlan && "md:col-span-2",
          )}
        >
          <span className="text-sm text-muted-foreground block mb-1">
            {t("monthlyUsage")}
          </span>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">
              {data.monthlyUsed ?? "0"}
            </span>
            <span className="text-sm text-muted-foreground mb-1">
              /{" "}
              {isFreePlan ? "3000" : (data.monthlyLimit ?? t("limit.unknown"))}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 border-none shadow-sm bg-background/60 backdrop-blur-sm h-fit">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t("title")}</h3>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {renderContent()}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <a
            href="https://resend.com/emails"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{t("viewDashboard")}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </Button>
      </div>
    </Card>
  );
}
