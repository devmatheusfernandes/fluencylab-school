// components/student/StudentPaymentStatusCard.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/config/pricing";
import { PaymentStatus } from "@/types/financial/subscription";
import { toast } from "sonner";
import Image from "next/image";
import { Calendar, CheckCircle, Clock, Clock1, Copy, FileWarning, MailWarning, X } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useTranslations, useLocale } from "next-intl";

interface StudentPaymentStatusCardProps {
  className?: string;
}

export function StudentPaymentStatusCard({
  className,
}: StudentPaymentStatusCardProps) {
  const t = useTranslations("StudentPaymentStatusCard");
  const locale = useLocale();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
    null
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
            : null
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "active":
        return {
          color: "success" as const,
          text: t("active"),
          icon: CheckCircle,
          description: t("activeDesc"),
        };
      case "overdue":
        return {
          color: "destructive" as const,
          text: t("overdue"),
          icon: FileWarning,
          description: t("overdueDesc"),
        };
      case "canceled":
        return {
          color: "warning" as const,
          text: t("canceled"),
          icon: X,
          description: t("canceledDesc"),
        };
      case "pending":
        return {
          color: "warning" as const,
          text: t("pending"),
          icon: Clock,
          description: t("pendingDesc"),
        };
      default:
        return {
          color: "secondary" as const,
          text: t("undefined"),
          icon: MailWarning,
          description: t("undefinedDesc"),
        };
    }
  };

  if (loading) {
    return (
      <Skeleton className="p-3">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton
                className="skeleton-base w-5 h-5 rounded-full"
              />
              <Skeleton
                className="skeleton-base h-6 w-48 rounded"
              />
            </div>
          </div>
          <Skeleton
            className="skeleton-base h-4 w-32 rounded mx-auto"
          />
          <Skeleton className="h-32 rounded" />
          <div className="flex justify-between">
            <Skeleton
               
               
              className="skeleton-base h-4 w-20 rounded"
            />
            <Skeleton
               
               
              className="skeleton-base h-4 w-16 rounded"
            />
          </div>
          <div className="flex justify-between">
            <Skeleton
               
               
              className="skeleton-base h-4 w-32 rounded"
            />
            <Skeleton
               
               
              className="skeleton-base h-4 w-24 rounded"
            />
          </div>
          <div className="flex justify-between">
            <Skeleton
               
               
              className="skeleton-base h-4 w-28 rounded"
            />
            <Skeleton
               
               
              className="skeleton-base h-4 w-20 rounded"
            />
          </div>
        </div>
      </Skeleton>
    );
  }

  if (!paymentStatus || !paymentStatus.subscriptionId) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-center">
          <MailWarning className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">{t("noSubscription")}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            (window.location.href = "/hub/student/my-payments")
          }
          className="w-full flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          {t("managePayments")}
        </Button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(paymentStatus.subscriptionStatus);
  const StatusIcon = statusInfo.icon;
  const daysUntilDue = getDaysUntilDue();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StatusIcon className="w-5 h-5"    />
          <h3 className="flex flex-row items-center gap-1 text-lg font-semibold">
            {t("title")}{" "}
            {paymentStatus.paymentMethod === "credit_card" ? (
              <p className="ml-1">{t("creditCard")}</p>
            ) : (
              <p className="ml-1">{t("pix")}</p>
            )}
          </h3>
        </div>
        <Badge   >
          {statusInfo.text}
          {paymentStatus.overdueDays && paymentStatus.overdueDays > 0 && (
            <span className="ml-1">({paymentStatus.overdueDays}d)</span>
          )}
        </Badge>
      </div>

      <p className={`hidden text-sm text-center text-${statusInfo.color} mb-4`}>
        {statusInfo.description}
      </p>

      {/* PIX Payment Section */}
      {paymentStatus.paymentMethod === "pix" && (
        <div className="mb-4">
          {/* Show QR Code when 5 days or less until due or overdue */}
          {(daysUntilDue !== null && daysUntilDue <= 5) ||
          paymentStatus.subscriptionStatus === "overdue" ? (
            <>
              {paymentStatus.pixCode ? (
                <div className="space-y-4">
                  {(daysUntilDue !== null && daysUntilDue <= 2) ||
                  paymentStatus.subscriptionStatus === "overdue" ? (
                    <>
                      {paymentStatus.pixQrCode && (
                        <div className="flex justify-center">
                          <Image
                            src={`data:image/png;base64,${paymentStatus.pixQrCode}`}
                            alt="QR Code PIX"
                            className="w-48 h-48 border rounded-lg"
                            width={100}
                            height={100}
                          />
                        </div>
                      )}
                      <div className="text-center text-sm text-gray-600">
                        {t("pixInstructions")}
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-3 bg-card rounded-lg">
                      <Clock1 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-blue-800">
                        {t("pixRelease", { days: daysUntilDue ?? 0 })}
                      </p>
                    </div>
                  )}

                  {/* PIX Code */}
                  <div className="flex flex-row justify-between p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      {paymentStatus.pixExpiresAt && (
                        <span className="text-xs text-paragraph">
                          {t("pixExpires")}{" "}
                          {new Date(
                            paymentStatus.pixExpiresAt
                          ).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                    <code className="hidden text-xs break-all font-mono">
                      {paymentStatus.pixCode}
                    </code>
                    <Button
                      size="sm"
                      variant="glass"
                      onClick={copyPixCode}
                      className="flex items-center gap-1"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      {t("copyPix")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {paymentStatus.subscriptionStatus === "overdue"
                      ? t("generatePixOverdue")
                      : t("generatePixNext")}
                  </p>
                  <Button
                    size="sm"
                    onClick={generatePixPayment}
                    disabled={generatingPix}
                    className="w-full"
                  >
                    {generatingPix ? t("generating") : t("generatePix")}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-20">
              <Calendar className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="hidden text-sm text-gray-700">
                {t("dueIn", { days: daysUntilDue ?? 0 })}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-bold mt-1">
                {t("pixAvailability")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Credit Card Status */}
      {paymentStatus.paymentMethod === "credit_card" && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {paymentStatus.subscriptionStatus === "active" ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{t("autoPaymentActive")}</span>
                </>
              ) : paymentStatus.subscriptionStatus === "overdue" ? (
                <>
                  <MailWarning className="w-4 h-4 text-red-600" />
                  <span className="text-sm">{t("paymentProblem")}</span>
                </>
              ) : (
                <>
                  <Clock1 className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm">{t("paymentPending")}</span>
                </>
              )}
            </div>

            {paymentStatus.subscriptionStatus === "overdue" && (
              <p className="text-xs text-red-600">
                {t("problemDesc")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Payment Information */}
      <div className="hidden space-y-2 text-sm border-t pt-3">
        {paymentStatus.amount && (
          <div className="flex justify-between">
            <span className="font-medium">{t("value")}</span>
            <span>{formatPrice(paymentStatus.amount)}</span>
          </div>
        )}

        {paymentStatus.nextPaymentDue && (
          <div className="flex justify-between">
            <span className="font-medium">{t("nextDue")}</span>
            <span>
              {new Date(paymentStatus.nextPaymentDue).toLocaleDateString(
                locale
              )}
            </span>
          </div>
        )}

        {paymentStatus.lastPaymentDate && (
          <div className="flex justify-between">
            <span className="font-medium">{t("lastPayment")}</span>
            <span>
              {new Date(paymentStatus.lastPaymentDate).toLocaleDateString(
                locale
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
