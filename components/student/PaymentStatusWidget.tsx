// components/student/PaymentStatusWidget.tsx
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

interface PaymentStatusWidgetProps {
  className?: string;
}

export function PaymentStatusWidget({ className }: PaymentStatusWidgetProps) {
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
        toast.success("Novo código PIX gerado com sucesso!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Erro ao gerar código PIX");
      }
    } catch (error) {
      console.error("Error generating PIX:", error);
      toast.error("Erro ao gerar código PIX");
    } finally {
      setGeneratingPix(false);
    }
  };

  const copyPixCode = async () => {
    if (paymentStatus?.pixCode) {
      try {
        await navigator.clipboard.writeText(paymentStatus.pixCode);
        toast.success("Código PIX copiado!");
      } catch (error) {
        toast.error("Erro ao copiar código PIX");
      }
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "active":
        return {
          color: "success" as const,
          text: "Em dia",
          icon: Link,
          description: "Sua mensalidade está em dia",
        };
      case "overdue":
        return {
          color: "destructive" as const,
          text: "Em atraso",
          icon: Link,
          description: "Sua mensalidade está em atraso",
        };
      case "canceled":
        return {
          color: "warning" as const,
          text: "Cancelado",
          icon: Link,
          description: "Sua assinatura foi cancelada",
        };
      case "pending":
        return {
          color: "warning" as const,
          text: "Pendente",
          icon: Link,
          description: "Aguardando confirmação do pagamento",
        };
      default:
        return {
          color: "secondary" as const,
          text: "Indefinido",
          icon: Link,
          description: "Status não definido",
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
          <p className="text-gray-600">Nenhuma assinatura encontrada</p>
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
          <h3 className="text-lg font-semibold">Status do Pagamento</h3>
        </div>
        <Badge >
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
                Pagamento em atraso
              </span>
            </div>

            {paymentStatus.pixCode ? (
              <div className="space-y-3">
                <p className="text-xs text-yellow-700">
                  Use o código PIX abaixo para efetuar o pagamento:
                </p>
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
                    Copiar PIX
                  </Button>
                  {paymentStatus.pixExpiresAt && (
                    <span className="text-xs text-yellow-600 self-center">
                      Expira em:{" "}
                      {new Date(paymentStatus.pixExpiresAt).toLocaleDateString(
                        "pt-BR"
                      )}
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
                {generatingPix ? "Gerando..." : "Gerar código PIX"}
              </Button>
            )}
          </div>
        )}

      {/* Payment Information */}
      <div className="space-y-3 text-sm">
        {paymentStatus.amount && (
          <div className="flex justify-between">
            <span className="font-medium">Valor:</span>
            <span>{formatPrice(paymentStatus.amount)}</span>
          </div>
        )}

        {paymentStatus.nextPaymentDue && (
          <div className="flex justify-between">
            <span className="font-medium">Próximo vencimento:</span>
            <span>
              {new Date(paymentStatus.nextPaymentDue).toLocaleDateString(
                "pt-BR"
              )}
            </span>
          </div>
        )}

        {paymentStatus.lastPaymentDate && (
          <div className="flex justify-between">
            <span className="font-medium">Último pagamento:</span>
            <span>
              {new Date(paymentStatus.lastPaymentDate).toLocaleDateString(
                "pt-BR"
              )}
            </span>
          </div>
        )}

        {paymentStatus.paymentMethod && (
          <div className="flex justify-between">
            <span className="font-medium">Método de pagamento:</span>
            <div className="flex items-center gap-1">
              {paymentStatus.paymentMethod === "credit_card" ? (
                <>
                  <Link className="w-4 h-4" />
                  <span>Cartão de crédito</span>
                </>
              ) : (
                <>
                  <span className="text-blue-600 font-semibold">PIX</span>
                </>
              )}
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
            (window.location.href = "/hub/plataforma/student/payments")
          }
          className="w-full flex items-center gap-2"
        >
          <Link className="w-4 h-4" />
          Gerenciar Pagamentos
        </Button>
      </div>
    </Card>
  );
}
