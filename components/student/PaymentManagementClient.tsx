"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalContent } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/config/pricing";
import { PaymentStatus, MonthlyPayment } from "@/types/financial/subscription";

import { toast } from "sonner";
import Image from "next/image";
import { Link } from "lucide-react";
import { Spinner } from "../ui/spinner";
import { useTranslations, useLocale } from "next-intl";
import { Header } from "../ui/header";

export function PaymentManagementClient() {
  const t = useTranslations("PaymentManagementClient");
  const locale = useLocale();

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
    null
  );
  const [paymentHistory, setPaymentHistory] = useState<MonthlyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [canceling, setCanceling] = useState(false);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  useEffect(() => {
    fetchPaymentStatus();
    fetchPaymentHistory();
  }, []);

  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch("/api/student/payment-status");
      if (response.ok) {
        const data = await response.json();
        setPaymentStatus(data);
      } else {
        toast.error(t("paymentStatusError"));
      }
    } catch (error) {
      console.error("Error fetching payment status:", error);
      toast.error(t("dataError"));
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch("/api/student/payment-history");
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data.payments || []);
      } else {
        // Don't show error toast for 404 (no subscription found)
        if (response.status !== 404) {
          toast.error(t("historyError"));
        }
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
      toast.error(t("historyLoadError"));
    } finally {
      setLoadingHistory(false);
    }
  };

  const generatePixPayment = async () => {
    if (!paymentStatus) return;

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
        toast.success(t("pixGenerated"));
      } else {
        const error = await response.json();
        toast.error(error.message || t("pixError"));
      }
    } catch (error) {
      toast.error(t("pixGenError"));
    } finally {
      setGeneratingPix(false);
    }
  };

  const cancelSubscription = async () => {
    if (!paymentStatus || !cancellationReason.trim()) return;

    setCanceling(true);
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: paymentStatus.subscriptionId,
          reason: cancellationReason,
          immediate: false,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setShowCancelModal(false);
        setCancellationReason("");

        if (result.cancellationFee > 0) {
          toast.success(
            t("subscriptionCanceledFee", { fee: formatPrice(result.cancellationFee) })
          );
        } else {
          toast.success(t("subscriptionCanceled"));
        }

        // Refresh payment status and history
        fetchPaymentStatus();
        fetchPaymentHistory();
      } else {
        const error = await response.json();
        toast.error(error.message || t("cancelError"));
      }
    } catch (error) {
      toast.error(t("cancelError"));
    } finally {
      setCanceling(false);
    }
  };

  const handleReturnToCheckout = async () => {
    if (!paymentStatus?.subscriptionId) return;

    setLoadingCheckout(true);
    try {
      const response = await fetch("/api/student/checkout-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: paymentStatus.subscriptionId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.checkoutUrl) {
          // Open in the same window to maintain the flow
          window.location.href = data.checkoutUrl;
        } else {
          toast.error(t("checkoutUrlError"));
        }
      } else {
        const error = await response.json();

        // If the checkout URL is not available, try to recreate it
        if (response.status === 404 || error.message?.includes("expired")) {
          console.log("Checkout URL not available, attempting to recreate...");
          await handleRecreateCheckout();
        } else {
          toast.error(error.message || t("checkoutUrlLoadError"));
        }
      }
    } catch (error) {
      console.error("Error getting checkout URL:", error);
      toast.error(t("checkoutLoadError"));
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleRecreateCheckout = async () => {
    if (!paymentStatus?.subscriptionId) return;

    try {
      toast.info(t("recreatingSession"));

      const response = await fetch("/api/student/recreate-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: paymentStatus.subscriptionId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.checkoutUrl) {
          toast.success(t("sessionRecreated"));
          // Small delay to show the message
          setTimeout(() => {
            window.location.href = data.checkoutUrl;
          }, 1000);
        } else {
          toast.error(t("sessionRecreateError"));
        }
      } else {
        const error = await response.json();
        toast.error(error.message || t("sessionRecreateError"));
      }
    } catch (error) {
      console.error("Error recreating checkout:", error);
      toast.error(t("sessionRecreateError"));
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
        };
      case "overdue":
        return {
          color: "destructive" as const,
          text: t("status.overdue"),
          icon: Link,
        };
      case "canceled":
        return {
          color: "warning" as const,
          text: t("status.canceled"),
          icon: Link,
        };
      case "pending":
        return {
          color: "warning" as const,
          text: t("status.pending"),
          icon: Link,
        };
      default:
        return {
          color: "secondary" as const,
          text: t("status.undefined"),
          icon: Link,
        };
    }
  };

  const getPaymentStatusBadge = (status: MonthlyPayment["status"]) => {
    switch (status) {
      case "paid":
        return { color: "success" as const, text: t("status.paid") };
      case "pending":
        return { color: "warning" as const, text: t("status.pending") };
      case "available":
        return { color: "secondary" as const, text: t("status.available") };
      case "overdue":
        return { color: "destructive" as const, text: t("status.overdue") };
      case "canceled":
        return { color: "warning" as const, text: t("status.canceled") };
      case "failed":
        return { color: "destructive" as const, text: t("status.failed") };
      default:
        return { color: "secondary" as const, text: t("status.undefined") };
    }
  };

  const exportPaymentHistory = () => {
    if (paymentHistory.length === 0) {
      toast.error(t("noDataExport"));
      return;
    }

    const csvContent = [
      [
        "Pagamento",
        "Vencimento",
        "Status",
        "Valor",
        "Data do Pagamento",
        "Método",
      ].join(","),
      ...paymentHistory.map((payment) =>
        [
          payment.description,
          new Date(payment.dueDate).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US"),
          getPaymentStatusBadge(payment.status).text,
          formatPrice(payment.amount),
          payment.paidAt
            ? new Date(payment.paidAt).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US")
            : "-",
          payment.paymentMethod === "pix" ? "PIX" : t("creditCard"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `historico-pagamentos-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success(t("historyExported"));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!paymentStatus) {
    return (
      <Card className="p-8 text-center">
        <Link className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {t("noSubscriptionTitle")}
        </h3>
        <p className="text-gray-600 mb-4">
          {t("noSubscriptionDesc")}
        </p>
        <Button
          onClick={() =>
            (window.location.href = "/hub/plataforma/student/subscription")
          }
        >
          {t("createSubscription")}
        </Button>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(paymentStatus.subscriptionStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Header 
        heading={t("headerTitle")} 
        subheading={t("headerSubtitle")} 
      />
      {/* Subscription Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-semibold">{t("subscriptionStatusTitle")}</h2>
              <p className="text-gray-600">{t("subscriptionStatusDesc")}</p>
            </div>
          </div>
          <Badge className="text-sm">
            {statusInfo.text}
            {paymentStatus.overdueDays && paymentStatus.overdueDays > 0 && (
              <span className="ml-1">({paymentStatus.overdueDays} {t("overdueDays")})</span>
            )}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-500">
                {t("monthlyValue")}
              </span>
              <p className="text-lg font-semibold">
                {paymentStatus.amount
                  ? formatPrice(paymentStatus.amount)
                  : "N/A"}
              </p>
            </div>

            {paymentStatus.nextPaymentDue && (
              <div>
                <span className="text-sm font-medium text-gray-500">
                  {t("nextDue")}
                </span>
                <p className="text-lg">
                  {new Date(paymentStatus.nextPaymentDue).toLocaleDateString(
                    locale === "pt" ? "pt-BR" : "en-US"
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-500">
                {t("paymentMethod")}
              </span>
              <div className="flex items-center gap-2 mt-1">
                {paymentStatus.paymentMethod === "credit_card" ? (
                  <>
                    <Link className="w-4 h-4" />
                    <span>{t("creditCard")}</span>
                  </>
                ) : (
                  <span className="text-primary font-semibold">PIX</span>
                )}
              </div>
            </div>

            {paymentStatus.lastPaymentDate && (
              <div>
                <span className="text-sm font-medium text-gray-500">
                  {t("lastPayment")}
                </span>
                <p className="text-lg">
                  {new Date(paymentStatus.lastPaymentDate).toLocaleDateString(
                    locale === "pt" ? "pt-BR" : "en-US"
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* PIX Payment Section */}
      {paymentStatus.subscriptionStatus === "overdue" &&
        paymentStatus.paymentMethod === "pix" && (
          <Card className="p-6 border-l-4 border-l-yellow-500">
            <div className="flex items-center gap-2 mb-4">
              <Link className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-yellow-800">
                {t("paymentOverdue")}
              </h3>
            </div>

            {paymentStatus.pixCode ? (
              <div className="space-y-4">
                <p className="text-gray-700">
                  {t("usePixCode")}
                </p>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{t("pixCodeLabel")}</span>
                    {paymentStatus.pixExpiresAt && (
                      <span className="text-xs text-gray-500">
                        {t("expiresIn", { date: new Date(paymentStatus.pixExpiresAt).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US") })}
                      </span>
                    )}
                  </div>

                  {/* QR Code Image */}
                  {paymentStatus.pixQrCode && (
                    <div className="flex justify-center mb-4">
                      <Image
                        src={`data:image/png;base64,${paymentStatus.pixQrCode}`}
                        alt="QR Code PIX"
                        className="w-48 h-48 border rounded-lg"
                        width={48}
                        height={48}
                      />
                    </div>
                  )}

                  <code className="text-sm break-all block font-mono bg-white p-3 rounded border">
                    {paymentStatus.pixCode}
                  </code>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={copyPixCode}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Link className="w-4 h-4" />
                    {t("copyCode")}
                  </Button>
                  <Button
                    onClick={generatePixPayment}
                    disabled={generatingPix}
                    variant="secondary"
                  >
                    <Link
                      className={`w-4 h-4 ${generatingPix ? "animate-spin" : ""}`}
                    />
                    {t("generateNewCode")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-700">
                  {t("generatePixDesc")}
                </p>
                <Button
                  onClick={generatePixPayment}
                  disabled={generatingPix}
                  className="w-full md:w-auto"
                >
                  {generatingPix ? t("generating") : t("generatePixCode")}
                </Button>
              </div>
            )}
          </Card>
        )}

      {/* Pending Credit Card Subscription Section */}
      {paymentStatus.subscriptionStatus === "pending" &&
        paymentStatus.paymentMethod === "credit_card" && (
          <Card className="p-6 border-l-4 border-l-orange-500">
            <div className="flex items-center gap-2 mb-4">
              <Link className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-800">
                {t("paymentPendingTitle")}
              </h3>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700">
                {t("paymentPendingDesc")}
              </p>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-start gap-3">
                  <Link className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800 mb-1">
                      {t("whatToDo")}
                    </h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• {t("step1")}</li>
                      <li>• {t("step2")}</li>
                      <li>
                        • {t("step3")}
                      </li>
                      <li>
                        • {t("step4")}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleReturnToCheckout}
                  disabled={loadingCheckout}
                  className="flex-1"
                  size="lg"
                >
                  {loadingCheckout ? (
                    <>
                      <Spinner />
                      {t("loadingCheckout")}
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 mr-2" />
                      {t("backToCheckout")}
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleRecreateCheckout}
                  disabled={loadingCheckout}
                  variant="secondary"
                  size="lg"
                  className="flex-1 sm:flex-initial"
                >
                  <Link
                    className={`w-4 h-4 mr-2 ${loadingCheckout ? "animate-spin" : ""}`}
                  />
                  {t("recreateSession")}
                </Button>
              </div>
            </div>
          </Card>
        )}

      {/* Payment History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t("paymentHistoryTitle")}</h3>
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
            onClick={exportPaymentHistory}
            disabled={paymentHistory.length === 0}
          >
            <Link className="w-4 h-4 mr-2" />
            {t("export")}
          </Button>
        </div>

        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : paymentHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Link className="w-8 h-8 mx-auto mb-2" />
            <p>{t("noPaymentFound")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentHistory.map((payment) => {
              const statusInfo = getPaymentStatusBadge(payment.status);
              return (
                <div
                  key={payment.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{payment.description}</h4>
                        <Badge className="">
                          {statusInfo.text}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium text-gray-500">
                            {t("dueDate")}
                          </span>
                          <p>
                            {new Date(payment.dueDate).toLocaleDateString(
                              locale === "pt" ? "pt-BR" : "en-US"
                            )}
                          </p>
                        </div>

                        <div>
                          <span className="font-medium text-gray-500">
                            {t("value")}
                          </span>
                          <p className="font-semibold">
                            {formatPrice(payment.amount)}
                          </p>
                        </div>

                        <div>
                          <span className="font-medium text-gray-500">
                            {t("paymentMethod")}
                          </span>
                          <p>
                            {payment.paymentMethod === "pix"
                              ? "PIX"
                              : t("creditCard")}
                          </p>
                        </div>

                        <div>
                          <span className="font-medium text-gray-500">
                            {t("paymentDate")}
                          </span>
                          <p>
                            {payment.paidAt
                              ? new Date(payment.paidAt).toLocaleDateString(
                                  locale === "pt" ? "pt-BR" : "en-US"
                                )
                              : "-"}
                          </p>
                        </div>
                      </div>

                      {payment.pixCode && payment.status !== "paid" && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-blue-600">
                              {t("pixAvailable")}
                            </span>
                            {payment.pixExpiresAt && (
                              <span className="text-xs text-gray-500">
                                {t("expiresIn", { date: new Date(payment.pixExpiresAt).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US") })}
                              </span>
                            )}
                          </div>

                          {/* QR Code Image for Payment History */}
                          {payment.pixQrCode && (
                            <div className="flex justify-center mb-3">
                              <Image
                                src={`data:image/png;base64,${payment.pixQrCode}`}
                                alt="QR Code PIX"
                                className="w-32 h-32 border rounded-lg"
                                width={32}
                                height={32}
                              />
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                if (payment.pixCode) {
                                  navigator.clipboard.writeText(
                                    payment.pixCode
                                  );
                                  toast.success(t("pixCopied"));
                                }
                              }}
                            >
                              <Link className="w-3 h-3 mr-1" />
                              {t("copyPix")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Subscription Actions */}
      {paymentStatus.subscriptionStatus !== "canceled" && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t("subscriptionActions")}</h3>
          <div className="space-y-3">
            <Button
              variant="destructive"
              onClick={() => setShowCancelModal(true)}
              className="w-full md:w-auto"
            >
              {t("cancelSubscription")}
            </Button>
            <p className="text-sm text-gray-500">
              {t("cancelFeeWarning")}
            </p>
          </div>
        </Card>
      )}

      {/* Cancel Subscription Modal */}
      <Modal
        open={showCancelModal}
        onOpenChange={(open) => {
          setShowCancelModal(open);
          if (!open) setCancellationReason("");
        }}
      >
        <ModalContent>
          <h2 className="text-lg font-semibold mb-4">{t("cancelModalTitle")}</h2>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Link className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 mb-1">{t("attention")}</p>
                  <p className="text-yellow-700">
                    {t("cancelWarning")}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t("cancelReasonLabel")}
              </label>
              <Textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder={t("cancelReasonPlaceholder")}
                rows={4}
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellationReason("");
                }}
                disabled={canceling}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={cancelSubscription}
                disabled={canceling || !cancellationReason.trim()}
                className="flex-1"
              >
                {canceling ? t("canceling") : t("confirmCancel")}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
