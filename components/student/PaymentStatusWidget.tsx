"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/config/pricing";
import { PaymentStatus } from "@/types/financial/subscription";

import { toast } from "sonner";
import { Link } from "lucide-react";
import { Spinner } from "../ui/spinner";
import { useTranslations, useLocale } from "next-intl";

interface PaymentStatusWidgetProps {
  className?: string;
}

export function PaymentStatusWidget({ className }: PaymentStatusWidgetProps) {
  const t = useTranslations("PaymentStatusWidget");
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
        toast.error(t("fetchError"));
      }
    } catch (error) {
      console.error("Error fetching payment status:", error);
      toast.error(t("fetchError"));
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
        toast.success(t("pixGenerated"));
      } else {
        const error = await response.json();
        toast.error(error.message || t("pixError"));
      }
    } catch (error) {
      console.error("Error generating PIX:", error);
      toast.error(t("pixError"));
    } finally {
      setGeneratingPix(false);
    }
  };

  const copyPixCode = async () => {
    if (paymentStatus?.pixCode) {
      try {
        await navigator.clipboard.writeText(paymentStatus.pixCode);
        toast.success(t("pixCopied"));
      } catch (error) {
        toast.error(t("pixCopyError"));
      }
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "active":
        return {
          color: "success" as const,
          text: t("status.active"),
          icon: Link,
          description: t("statusDesc.active"),
        };
      case "overdue":
        return {
          color: "destructive" as const,
          text: t("status.overdue"),
          icon: Link,
          description: t("statusDesc.overdue"),
        };
      case "canceled":
        return {
          color: "warning" as const,
          text: t("status.canceled"),
          icon: Link,
          description: t("statusDesc.canceled"),
        };
      case "pending":
        return {
          color: "warning" as const,
          text: t("status.pending"),
          icon: Link,
          description: t("statusDesc.pending"),
        };
      default:
        return {
          color: "secondary" as const,
          text: t("status.undefined"),
          icon: Link,
          description: t("statusDesc.undefined"),
        };
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <Spinner />
        </div>
      </Card>
    );
  }

  if (!paymentStatus) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <Link className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">{t("noSubscription")}</p>
        </div>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(paymentStatus.subscriptionStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StatusIcon className="w-5 h-5" />
          <h3 className="text-lg font-semibold">{t("paymentStatusTitle")}</h3>
        </div>
        <Badge>
          {statusInfo.text}
          {paymentStatus.overdueDays && paymentStatus.overdueDays > 0 && (
            <span className="ml-1">({paymentStatus.overdueDays}d)</span>
          )}
        </Badge>
      </div>

      <p className="text-sm text-gray-600 mb-4">{statusInfo.description}</p>

      {/* PIX Payment Section for Overdue */}
      {paymentStatus.subscriptionStatus === "overdue" &&
        paymentStatus.paymentMethod === "pix" && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Link className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {t("paymentOverdue")}
              </span>
            </div>

            {paymentStatus.pixCode ? (
              <div className="space-y-3">
                <p className="text-xs text-yellow-700">{t("usePixCode")}</p>
                <div className="bg-white p-3 rounded border">
                  <code className="text-xs break-all font-mono">
                    {paymentStatus.pixCode}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={copyPixCode}
                    className="flex items-center gap-1"
                  >
                    <Link className="w-3 h-3" />
                    {t("copyPix")}
                  </Button>
                  {paymentStatus.pixExpiresAt && (
                    <span className="text-xs text-yellow-600 self-center">
                      {t("expiresIn", {
                        date: new Date(
                          paymentStatus.pixExpiresAt,
                        ).toLocaleDateString(
                          locale === "pt" ? "pt-BR" : "en-US",
                        ),
                      })}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={generatePixPayment}
                disabled={generatingPix}
                className="w-full"
              >
                {generatingPix ? t("generating") : t("generatePix")}
              </Button>
            )}
          </div>
        )}

      {/* Payment Information */}
      <div className="space-y-3 text-sm">
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
                locale === "pt" ? "pt-BR" : "en-US",
              )}
            </span>
          </div>
        )}

        {paymentStatus.lastPaymentDate && (
          <div className="flex justify-between">
            <span className="font-medium">{t("lastPayment")}</span>
            <span>
              {new Date(paymentStatus.lastPaymentDate).toLocaleDateString(
                locale === "pt" ? "pt-BR" : "en-US",
              )}
            </span>
          </div>
        )}

        {paymentStatus.paymentMethod && (
          <div className="flex justify-between">
            <span className="font-medium">{t("paymentMethod")}</span>
            <div className="flex items-center gap-1">
              <span className="text-blue-600 font-semibold">PIX</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-4 border-t">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            (window.location.href = `/${locale}/hub/student/my-payments`)
          }
          className="w-full flex items-center gap-2"
        >
          <Link className="w-4 h-4" />
          {t("managePayments")}
        </Button>
      </div>
    </Card>
  );
}
