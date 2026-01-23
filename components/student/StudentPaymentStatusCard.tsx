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
  CreditCard,
  QrCode,
  Loader2,
  Wallet,
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
          bg: "bg-teal-100/50 dark:bg-teal-900/20",
          text: "text-teal-700 dark:text-teal-400",
          border: "border-teal-200 dark:border-teal-800",
          icon: CheckCircle2,
          label: t("active"),
        };
      case "overdue":
        return {
          bg: "bg-red-100/50 dark:bg-red-900/20",
          text: "text-red-700 dark:text-red-400",
          border: "border-red-200 dark:border-red-800",
          icon: AlertTriangle,
          label: t("overdue"),
        };
      case "canceled":
        return {
          bg: "bg-zinc-100/50 dark:bg-zinc-800/50",
          text: "text-zinc-600 dark:text-zinc-400",
          border: "border-zinc-200 dark:border-zinc-700",
          icon: XCircle,
          label: t("canceled"),
        };
      default:
        return {
          bg: "bg-amber-100/50 dark:bg-amber-900/20",
          text: "text-amber-700 dark:text-amber-400",
          border: "border-amber-200 dark:border-amber-800",
          icon: Clock,
          label: t("pending"),
        };
    }
  };

  // ----------------------------------------------------------------------
  // LOADING STATE
  // ----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 bg-white dark:bg-zinc-900 shadow-sm space-y-6 h-full">
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-20 h-3" />
            </div>
          </div>
          <Skeleton className="w-24 h-8 rounded-full" />
        </div>
        <Skeleton className="w-full h-40 rounded-lg" />
        <div className="flex justify-between pt-4 border-t dark:border-zinc-800">
          <Skeleton className="w-20 h-10" />
          <Skeleton className="w-20 h-10" />
          <Skeleton className="w-20 h-10" />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // EMPTY STATE
  // ----------------------------------------------------------------------
  if (!paymentStatus || !paymentStatus.subscriptionId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 card-base h-full">
        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3">
          <Wallet className="w-6 h-6 text-zinc-400" />
        </div>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          {t("noSubscription")}
        </h3>
        <p className="text-sm text-zinc-500 mb-4 max-w-xs">
          {t("undefinedDesc")}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = "/hub/student/my-payments")}
          className="gap-2"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          {t("managePayments")}
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(paymentStatus.subscriptionStatus);
  const StatusIcon = statusConfig.icon;
  const daysUntilDue = getDaysUntilDue();
  const isPix = paymentStatus.paymentMethod === "pix";

  return (
      <div className="flex flex-col items-center justify-center p-8 card-base h-full">
      {/* HEADER */}
      <div className="p-5 flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2.5 rounded-lg",
              isPix
                ? "bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/20"
                : "bg-indigo-100/50 text-indigo-600 dark:bg-indigo-900/20",
            )}
          >
            {isPix ? (
              <QrCode className="w-5 h-5" />
            ) : (
              <CreditCard className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg leading-none">
              {t("title")}
            </h3>
            <p className="text-sm text-zinc-500 mt-1.5">
              {isPix ? t("pix") : t("creditCard")}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
            statusConfig.bg,
            statusConfig.text,
            statusConfig.border,
          )}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{statusConfig.label}</span>
          {paymentStatus.overdueDays && paymentStatus.overdueDays > 0 && (
            <span className="ml-1 opacity-80">
              ({paymentStatus.overdueDays}d)
            </span>
          )}
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="p-5">
        {/* === PIX LOGIC === */}
        {isPix && (
          <div className="w-full">
            {/* Logic: Show QR Code when <= 5 days or Overdue */}
            {(daysUntilDue !== null && daysUntilDue <= 5) ||
            paymentStatus.subscriptionStatus === "overdue" ? (
              <div className="space-y-6">
                {paymentStatus.pixCode ? (
                  // STATE: PIX GENERATED
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    {/* QR Code Container */}
                    <div className="relative group bg-white p-2 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700">
                      {paymentStatus.pixQrCode && (
                        <Image
                          src={`data:image/png;base64,${paymentStatus.pixQrCode}`}
                          alt="QR Code PIX"
                          width={140}
                          height={140}
                          className="rounded-lg mix-blend-multiply dark:mix-blend-normal dark:bg-white"
                        />
                      )}
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                        <QrCode className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Copy Paste Info */}
                    <div className="flex-1 w-full space-y-3">
                      <div className="text-center md:text-left space-y-1">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {t("pixInstructions")}
                        </p>
                        {paymentStatus.pixExpiresAt && (
                          <p className="text-xs text-red-500 flex items-center justify-center md:justify-start gap-1">
                            <Clock className="w-3 h-3" />
                            {t("pixExpires")}{" "}
                            {new Date(
                              paymentStatus.pixExpiresAt,
                            ).toLocaleDateString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 p-1 pl-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <code className="flex-1 text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-[200px] md:max-w-xs">
                          {paymentStatus.pixCode}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 hover:bg-white dark:hover:bg-zinc-700 shadow-sm"
                          onClick={copyPixCode}
                        >
                          <Copy className="w-3.5 h-3.5 mr-2" />
                          {t("copyPix")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // STATE: READY TO GENERATE
                  <div className="text-center py-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="mb-3 flex justify-center">
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full">
                        <QrCode className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4 max-w-sm mx-auto">
                      {paymentStatus.subscriptionStatus === "overdue"
                        ? t("generatePixOverdue")
                        : t("generatePixNext")}
                    </p>
                    <Button
                      onClick={generatePixPayment}
                      disabled={generatingPix}
                      className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white"
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
              <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                <Clock className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {t("pixAvailability")}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {t("pixRelease", { days: daysUntilDue ?? 0 })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* === CREDIT CARD LOGIC === */}
        {!isPix && (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
            <div className={cn("p-2 rounded-full", statusConfig.bg)}>
              <StatusIcon className={cn("w-5 h-5", statusConfig.text)} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {paymentStatus.subscriptionStatus === "overdue"
                  ? t("paymentProblem")
                  : t("autoPaymentActive")}
              </p>
              {paymentStatus.subscriptionStatus === "overdue" && (
                <p className="text-xs text-red-500 mt-1">{t("problemDesc")}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER DETAILS - GRID LAYOUT */}
      <div className="bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 p-5">
        <div className="grid grid-cols-3 gap-4">
          {/* Amount */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
              {t("value")}
            </span>
            <span className="text-sm md:text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {paymentStatus.amount ? formatPrice(paymentStatus.amount) : "-"}
            </span>
          </div>

          {/* Next Due */}
          <div className="flex flex-col border-l border-zinc-200 dark:border-zinc-800 pl-4">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
              {t("nextDue")}
            </span>
            <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-sm font-medium">
                {paymentStatus.nextPaymentDue
                  ? new Date(paymentStatus.nextPaymentDue).toLocaleDateString(
                      locale,
                      { day: "2-digit", month: "short" },
                    )
                  : "-"}
              </span>
            </div>
          </div>

          {/* Last Payment */}
          <div className="hidden md:flex flex-col border-l border-zinc-200 dark:border-zinc-800 pl-4">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
              {t("lastPayment")}
            </span>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {paymentStatus.lastPaymentDate
                ? new Date(paymentStatus.lastPaymentDate).toLocaleDateString(
                    locale,
                  )
                : "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
