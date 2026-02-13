"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/config/pricing";
import { PaymentStatus } from "@/types/financial/subscription";
import { toast } from "sonner";
import Image from "next/image";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  AlertTriangle,
  XCircle,
  QrCode,
  Loader2,
  Wallet,
  CheckCheckIcon,
} from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useTranslations, useLocale } from "next-intl";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utilitário para classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function StudentPaymentStatusCard() {
  const t = useTranslations("StudentPaymentStatusCard");
  const locale = useLocale();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [generatingPix, setGeneratingPix] = useState(false);

  useEffect(() => {
    fetchPaymentStatus();
  }, []);

  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch("/api/student/payment-status");
      if (response.ok) {
        const data = await response.json();
        setPaymentStatus(data);
      } else {
        console.error("Failed to fetch payment status");
      }
    } catch (error) {
      console.error("Error fetching payment status:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePixPayment = async () => {
    if (!paymentStatus || paymentStatus.paymentMethod !== "pix") return;

    setGeneratingPix(true);
    try {
      const response = await fetch("/api/student/generate-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: paymentStatus.subscriptionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentStatus((prev) =>
          prev
            ? {
                ...prev,
                pixCode: data.pixCode,
                pixQrCode: data.pixQrCode,
                pixExpiresAt: new Date(data.expiresAt),
              }
            : null,
        );
        toast.success(t("generateSuccess"));
      } else {
        const error = await response.json();
        toast.error(error.message || t("generateError"));
      }
    } catch (error) {
      console.error("Error generating PIX:", error);
      toast.error(t("generateError"));
    } finally {
      setGeneratingPix(false);
    }
  };

  const copyPixCode = async () => {
    if (paymentStatus?.pixCode) {
      try {
        await navigator.clipboard.writeText(paymentStatus.pixCode);
        toast.success(t("copySuccess"));
      } catch (error) {
        toast.error(t("copyError"));
      }
    }
  };

  const getDaysUntilDue = () => {
    if (!paymentStatus?.nextPaymentDue) return null;
    const dueDate = new Date(paymentStatus.nextPaymentDue);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          bg: "bg-teal-50 dark:bg-teal-900/10",
          text: "text-teal-700 dark:text-teal-400",
          border: "border-teal-200 dark:border-teal-800",
          icon: CheckCircle2,
          label: t("active"),
        };
      case "overdue":
        return {
          bg: "bg-red-50 dark:bg-red-900/10",
          text: "text-red-700 dark:text-red-400",
          border: "border-red-200 dark:border-red-800",
          icon: AlertTriangle,
          label: t("overdue"),
        };
      case "canceled":
        return {
          bg: "bg-zinc-100 dark:bg-zinc-800/50",
          text: "text-zinc-600 dark:text-zinc-400",
          border: "border-zinc-200 dark:border-zinc-700",
          icon: XCircle,
          label: t("canceled"),
        };
      default:
        return {
          bg: "bg-amber-50 dark:bg-amber-900/10",
          text: "text-amber-700 dark:text-amber-400",
          border: "border-amber-200 dark:border-amber-800",
          icon: Clock,
          label: t("pending"),
        };
    }
  };

  if (loading) {
    return <Skeleton className="w-full h-full min-h-[320px] rounded-xl" />;
  }

  if (!paymentStatus || !paymentStatus.subscriptionId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl h-full shadow-sm">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-full mb-4 ring-1 ring-zinc-200 dark:ring-zinc-700">
          <Wallet className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg mb-2 text-center">
          {t("noSubscription")}
        </h3>
        <p className="text-sm text-zinc-500 mb-6 text-center max-w-[250px]">
          {t("undefinedDesc")}
        </p>
        <Button
          variant="outline"
          onClick={() =>
            (window.location.href = `/${locale}/hub/student/my-payments`)
          }
          className="gap-2"
        >
          <QrCode className="w-4 h-4" />
          {t("managePayments")}
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(paymentStatus.subscriptionStatus);
  const StatusIcon = statusConfig.icon;
  const daysUntilDue = getDaysUntilDue();
  const isOverdue = paymentStatus.subscriptionStatus === "overdue";

  return (
    <div
      className={cn(
        "card-base flex flex-col h-full rounded-xl border transition-all duration-300",
        isOverdue
          ? "border-red-200 dark:border-red-900/50 shadow-red-100 dark:shadow-none"
          : "border-zinc-200 dark:border-zinc-800",
      )}
    >
      {/* HEADER */}
      <div className="p-5 flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2.5 rounded-xl shadow-sm border",
              "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400",
            )}
          >
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg leading-tight">
              {t("title")}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">{t("pix")}</p>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 pl-2.5 pr-3 py-1 rounded-full text-xs font-semibold border transition-colors",
            statusConfig.bg,
            statusConfig.text,
            statusConfig.border,
          )}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{statusConfig.label}</span>
        </div>
        {/* TODO: BOTÃO QUE FAZ A CHECAGEM MANUAL */}
        {/* <div
          onClick={fetchPaymentStatus}
          className={cn(
            "flex items-center p-2 rounded-full text-xs font-semibold border transition-colors",
            statusConfig.bg,
            statusConfig.text,
            statusConfig.border,
          )}
        >
          <CheckCheckIcon className="w-3.5 h-3.5" />
        </div> */}
      </div>

      {/* BODY CONTENT - FLEX GROWS TO FILL SPACE */}
      <div className="flex-1 p-5 flex flex-col justify-center">
        <div className="w-full">
          {(daysUntilDue !== null && daysUntilDue <= 5) || isOverdue ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
              {paymentStatus.pixCode ? (
                // STATE: PIX GENERATED
                <div className="flex flex-col lg:flex-row gap-5 items-center lg:items-start">
                  {/* QR Code */}
                  <div className="relative shrink-0 group bg-white p-2 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 shadow-sm">
                    {paymentStatus.pixQrCode && (
                      <Image
                        src={`data:image/png;base64,${paymentStatus.pixQrCode}`}
                        alt="QR Code PIX"
                        width={120}
                        height={120}
                        className="rounded-lg mix-blend-multiply dark:mix-blend-normal dark:bg-white"
                      />
                    )}
                    {/* Timer Overlay */}
                    {paymentStatus.pixExpiresAt && (
                      <div className="absolute inset-x-0 -bottom-3 flex justify-center">
                        <span className="bg-zinc-900 text-white text-[10px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Expira em breve
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Copy/Paste Section */}
                  <div className="flex-1 w-full space-y-3 min-w-0">
                    <div className="text-center lg:text-left">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {t("pixInstructions")}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Use o app do seu banco para escanear ou copie o código
                        abaixo.
                      </p>
                    </div>

                    <div className="relative flex items-center">
                      <div className="w-full flex items-center gap-2 p-1.5 pl-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                        <code className="flex-1 text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate select-all">
                          {paymentStatus.pixCode}
                        </code>
                        <Button
                          size="sm"
                          className="h-8 shadow-sm bg-white dark:bg-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-600"
                          onClick={copyPixCode}
                        >
                          <Copy className="w-3.5 h-3.5 mr-2" />
                          {t("copyPix")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // STATE: READY TO GENERATE
                <div className="flex flex-col items-center text-center py-2">
                  <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-full">
                    <QrCode className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
                  </div>
                  <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                    {isOverdue ? t("pixOverdueTitle") : t("pixReadyTitle")}
                  </h4>
                  <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
                    {isOverdue ? t("generatePixOverdue") : t("generatePixNext")}
                  </p>
                  <Button
                    onClick={generatePixPayment}
                    disabled={generatingPix}
                    className={cn(
                      "w-full sm:w-auto min-w-[200px] font-semibold shadow-lg shadow-emerald-500/10",
                      isOverdue
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white",
                    )}
                  >
                    {generatingPix ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <QrCode className="w-4 h-4 mr-2" />
                    )}
                    {generatingPix ? t("generating") : t("generatePix")}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // STATE: TOO EARLY
            <div className="flex flex-col items-center justify-center py-6 text-zinc-400">
              <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {t("pixAvailability")}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {t("pixRelease", { days: daysUntilDue ?? 0 })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER DETAILS - RESPONSIVE GRID */}
      <div className="bg-zinc-50/50 dark:bg-zinc-950/30 border-t border-zinc-100 dark:border-zinc-800 p-4 lg:p-5 rounded-b-xl">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
          {/* Amount - Always Visible */}
          <div className="flex flex-col col-span-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1">
              {t("value")}
            </span>
            <span className="text-base lg:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {paymentStatus.amount ? formatPrice(paymentStatus.amount) : "-"}
            </span>
          </div>

          {/* Next Due - Always Visible */}
          <div className="flex flex-col col-span-1 border-l border-zinc-200 dark:border-zinc-800 pl-4 lg:pl-6">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1">
              {t("nextDue")}
            </span>
            <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
              {isOverdue ? (
                <span className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t("expired")}
                </span>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-sm font-medium">
                    {paymentStatus.nextPaymentDue
                      ? new Date(
                          paymentStatus.nextPaymentDue,
                        ).toLocaleDateString(locale, {
                          day: "2-digit",
                          month: "short",
                        })
                      : "-"}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Last Payment - Desktop Only or Full Width on Mobile if space permits */}
          <div className="hidden lg:flex flex-col border-l border-zinc-200 dark:border-zinc-800 pl-6">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1">
              {t("lastPayment")}
            </span>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {paymentStatus.lastPaymentDate
                ? new Date(paymentStatus.lastPaymentDate).toLocaleDateString(
                    locale,
                    { day: "2-digit", month: "short", year: "2-digit" },
                  )
                : "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
