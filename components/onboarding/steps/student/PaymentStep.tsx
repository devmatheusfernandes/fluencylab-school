// components/onboarding/steps/PaymentStep.tsx
"use client";

import React, { useState, useEffect } from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { formatPrice } from "@/config/pricing";
import {
  Calendar,
  Car,
  SquareCheck,
  Info,
  Link,
  QrCode,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface PaymentMethodCardProps {
  method: "pix" | "credit_card";
  title: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
  selected: boolean;
  onSelect: () => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  title,
  description,
  icon,
  benefits,
  selected,
  onSelect,
}) => {
  return (
    <Card
      className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
        selected
          ? "!border-1 !border-primary !bg-primary/5 dark:bg-primary/30 transform scale-103"
          : "!bg-white/10 !border-3"
      }`}
      onClick={onSelect}
    >
      <div className="text-center mb-4">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
            selected
              ? "bg-indigo-100 dark:bg-indigo-800"
              : "bg-gray-100 dark:bg-gray-700"
          }`}
        >
          <div
            className={
              selected
                ? "text-primary-hover "
                : "text-gray-600 dark:text-gray-300"
            }
          >
            {icon}
          </div>
        </div>

        <Text size="lg" className={selected ? "text-paragraph" : ""}>
          {title}
        </Text>
        <Text
          className={`mt-2 ${selected ? "text-title" : "text-gray-600 dark:text-gray-300"}`}
        >
          {description}
        </Text>
      </div>

      <div className="space-y-2 mb-4">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-center gap-2">
            <Info className="w-4 h-4 text-success flex-shrink-0" />
            <Text
              size="sm"
              className={
                selected ? "text-paragraph" : "text-gray-600 dark:text-gray-300"
              }
            >
              {benefit}
            </Text>
          </div>
        ))}
      </div>

      <div
        className={`text-center p-2 rounded-lg ${
          selected
            ? "bg-indigo-100 dark:bg-indigo-800/50"
            : "bg-gray-50 dark:bg-gray-700/50"
        }`}
      >
        <Text
          size="sm"
          className={`font-medium ${
            selected
              ? "text-indigo-900 dark:text-indigo-100"
              : "text-gray-700 dark:text-gray-300"
          }`}
        >
          {selected ? "✓ Selecionado" : "Clique para selecionar"}
        </Text>
      </div>
    </Card>
  );
};

export const PaymentStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
  onNext,
  isLoading: parentLoading,
}) => {
  const [billingDay, setBillingDay] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentRedirecting, setPaymentRedirecting] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [checkingPaymentStatus, setCheckingPaymentStatus] = useState(true);
  const { data: session } = useSession();

  const basePrice = 29900;
  const monthlyPrice =
    data.contractLengthMonths === 12 ? Math.round(basePrice * 0.85) : basePrice;

  const paymentMethods = [
    {
      method: "pix" as const,
      title: "PIX",
      description: "Pagamento instantâneo via QR Code",
      icon: <QrCode className="w-8 h-8" />,
      benefits: [
        "Pagamento instantâneo",
        "Sem taxas adicionais",
        "QR Code válido por 7 dias",
        "Comprovante automático",
      ],
    },
    {
      method: "credit_card" as const,
      title: "Cartão de Crédito",
      description: "Pagamento recorrente automático",
      icon: <Car className="w-8 h-8" />,
      benefits: [
        "Pagamento automático mensal",
        "Processo seguro e criptografado",
        "Sem necessidade de lembrar",
        "Fácil cancelamento",
      ],
    },
  ];

  const handleMethodSelect = (method: "pix" | "credit_card") => {
    onDataChange({ paymentMethod: method });
  };

  const handleBillingDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const day = parseInt(e.target.value);
    if (day >= 1 && day <= 28) {
      setBillingDay(day);
    }
  };

  const processPayment = async () => {
    if (!data.paymentMethod) {
      toast.error("Selecione um método de pagamento");
      return;
    }

    if (billingDay < 1 || billingDay > 28) {
      toast.error("O dia de vencimento deve estar entre 1 e 28");
      return;
    }

    setIsProcessing(true);
    setPaymentRedirecting(false);

    try {
      if (data.paymentMethod === "pix") {
        setProcessingMessage("Criando sua assinatura PIX...");
      } else {
        setProcessingMessage("Redirecionando para pagamento seguro...");
      }

      const response = await fetch("/api/onboarding/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: data.paymentMethod,
          billingDay,
          contractLengthMonths: data.contractLengthMonths,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create subscription");
      }

      const result = await response.json();

      if (data.paymentMethod === "pix") {
        // PIX payment created - mark as completed and continue
        onDataChange({
          paymentCompleted: true,
          subscriptionId: result.subscription.id,
        });
        toast.success("Assinatura PIX criada! QR Code gerado com sucesso.");
        onNext();
      } else {
        // Credit card - redirect to external payment
        if (result.checkoutUrl) {
          setProcessingMessage("Redirecionando para pagamento...");
          setPaymentRedirecting(true);

          // Simulate processing for user feedback
          setTimeout(() => {
            window.location.href = result.checkoutUrl;
          }, 2000);
        } else {
          throw new Error("No checkout URL received");
        }
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Erro ao processar pagamento. Tente novamente.");
      setIsProcessing(false);
      setPaymentRedirecting(false);
      setProcessingMessage("");
    }
  };

  // Check payment status on mount and for returning credit card payments
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!session?.user?.id) {
        setCheckingPaymentStatus(false);
        return;
      }

      try {
        const response = await fetch("/api/onboarding/check-payment-status");
        if (response.ok) {
          const { hasActiveSubscription } = await response.json();
          if (hasActiveSubscription) {
            onDataChange({ paymentCompleted: true });
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      } finally {
        setCheckingPaymentStatus(false);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("payment_success");
    const cancelled = urlParams.get("payment_cancelled");

    if (success === "true") {
      onDataChange({ paymentCompleted: true });
      toast.success("Pagamento processado com sucesso!");
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      setCheckingPaymentStatus(false);
    } else if (cancelled === "true") {
      toast.error("Pagamento cancelado. Tente novamente.");
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      setCheckingPaymentStatus(false);
    } else {
      checkPaymentStatus();
    }
  }, [session?.user?.id, onDataChange]);

  // Auto-advance when payment is completed and status checking is done
  useEffect(() => {
    if (data.paymentCompleted && !checkingPaymentStatus) {
      // Small delay to show success message briefly
      const timer = setTimeout(() => {
        onNext();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [data.paymentCompleted, checkingPaymentStatus, onNext]);

  if (checkingPaymentStatus) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-2xl mx-auto">
          <Spinner />
          <Text size="xl" className="mb-4">
            Verificando status do pagamento...
          </Text>
          <Text className="text-gray-600 dark:text-gray-300">
            Aguarde enquanto verificamos sua assinatura.
          </Text>
        </div>
      </div>
    );
  }

  if (data.paymentCompleted) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full mb-6">
            <SquareCheck className="w-8 h-8 text-success-light" />
          </div>

          <Text size="2xl" className="mb-4 text-success-light">
            Pagamento Processado!
          </Text>

          <Text size="lg" className="text-green-700 dark:text-green-200 mb-8">
            {data.paymentMethod === "pix"
              ? "Sua assinatura PIX foi criada com sucesso! Você pode acessar o QR Code na área de pagamentos."
              : "Seu pagamento foi processado com sucesso! Sua assinatura está ativa."}
          </Text>

          <Button onClick={onNext} size="lg" variant="success">
            Finalizar integração
          </Button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-800 rounded-full mb-6">
            {paymentRedirecting ? (
              <Link className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
            ) : (
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          <Text size="xl" className="mb-4">
            {paymentRedirecting ? "Redirecionando..." : "Processando Pagamento"}
          </Text>

          <Text className="text-gray-600 dark:text-gray-300 mb-6">
            {processingMessage}
          </Text>

          {paymentRedirecting && (
            <Card className="p-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700">
              <div className="flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-200">
                <Link className="w-5 h-5" />
                <Text size="sm">
                  Você será redirecionado para uma página segura do Mercado Pago
                </Text>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <Text size="2xl" className="mb-4">
            Escolha sua Forma de Pagamento
          </Text>
          <Text size="lg" className="text-gray-600 dark:text-gray-300">
            Selecione como deseja pagar sua mensalidade do Fluency Lab.
          </Text>
        </div>

        {/* Payment Summary */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-indigo-50 to-green-50 dark:from-indigo-900/30 dark:to-green-900/30 border border-indigo-200 dark:border-indigo-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div>
              <Text className="font-semibold text-primary-hover">
                Valor Mensal
              </Text>
              <Text size="2xl" className="font-bold text-primary">
                {formatPrice(monthlyPrice)}
              </Text>
            </div>

            <div>
              <Text className="font-semibold text-secondary-hover">
                Duração
              </Text>
              <Text size="xl" className="font-bold text-secondary">
                {data.contractLengthMonths} meses
              </Text>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.method}
              {...method}
              selected={data.paymentMethod === method.method}
              onSelect={() => handleMethodSelect(method.method)}
            />
          ))}
        </div>

        {/* Billing Day Selection */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-primary" />
            <Text size="lg">Dia de Vencimento</Text>
          </div>

          <Text className="text-gray-600 dark:text-gray-300 mb-4">
            Escolha o dia do mês em que prefere receber sua cobrança (entre 1 e
            28).
          </Text>

          <div className="flex items-center gap-4">
            <Text>Dia:</Text>
            <Input
              type="number"
              min="1"
              max="28"
              value={billingDay}
              onChange={handleBillingDayChange}
              className="w-20"
            />
            <Text size="sm" className="text-gray-500">
              A cobrança será feita todo dia {billingDay} do mês
            </Text>
          </div>
        </Card>

        {/* Payment Method Details */}
        {data.paymentMethod && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-900/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-800 rounded-lg flex items-center justify-center">
                {data.paymentMethod === "pix" ? (
                  <Link className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
                ) : (
                  <Link className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
                )}
              </div>

              <div className="flex-1">
                <Text className="font-semibold mb-2">
                  {data.paymentMethod === "pix"
                    ? "Como funciona o PIX:"
                    : "Como funciona o Cartão de Crédito:"}
                </Text>

                {data.paymentMethod === "pix" ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
                        1
                      </div>
                      <Text size="sm">
                        Um QR Code será gerado para cada mensalidade
                      </Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
                        2
                      </div>
                      <Text size="sm">
                        Você será notificado 2 dias antes do vencimento
                      </Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
                        3
                      </div>
                      <Text size="sm">
                        Pagamento confirmado automaticamente após o PIX
                      </Text>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
                        1
                      </div>
                      <Text size="sm">
                        Você será redirecionado para uma página segura
                      </Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
                        2
                      </div>
                      <Text size="sm">
                        Digite os dados do cartão uma única vez
                      </Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
                        3
                      </div>
                      <Text size="sm">
                        Cobrança automática todo mês no dia {billingDay}
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 mb-8">
          <div className="flex items-center gap-3">
            <Link className="w-6 h-6 text-green-600 dark:text-green-300" />
            <div>
              <Text className="font-semibold text-green-800 dark:text-green-100">
                Pagamento 100% Seguro
              </Text>
              <Text size="sm" className="text-green-700 dark:text-green-200">
                Utilizamos criptografia de ponta e processamos pagamentos
                através do Mercado Pago, uma das plataformas mais seguras do
                Brasil.
              </Text>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <div className="text-center">
          <Button
            onClick={processPayment}
            disabled={!data.paymentMethod || isProcessing || parentLoading}
            size="lg"
            isLoading={isProcessing}
            className={`px-8 py-3 font-semibold transition-all duration-200 ${
              data.paymentMethod
                ? "bg-gradient-to-r from-primary/90 to-primary/70 hover:bg-primary-hover text-white"
                : "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
            }`}
          >
            {!data.paymentMethod
              ? "Selecione um método de pagamento"
              : data.paymentMethod === "pix"
                ? "Criar assinatura PIX"
                : "Prosseguir com cartão de crédito"}
          </Button>
        </div>
      </div>
    </div>
  );
};
