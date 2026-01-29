// components/onboarding/steps/PaymentStep.tsx
"use client";

import React, { useState, useEffect } from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { formatPrice } from "@/config/pricing";
import {
  Calendar,
  SquareCheck,
  Info,
  Link,
  QrCode,
  AlertTriangle,
  Clock
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface PaymentMethodCardProps {
  method: "pix";
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
  const [billingDay, setBillingDay] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [checkingPaymentStatus, setCheckingPaymentStatus] = useState(true);
  const { data: session } = useSession();

  // New State for Contract Start Date and Late Entry Logic
  const [contractStartDate, setContractStartDate] = useState<Date | null>(null);
  const [isLateEntry, setIsLateEntry] = useState(false);
  const [lateEntryOption, setLateEntryOption] = useState<"pro_rated" | "full_plus_credits" | null>(null);
  const [proRatedAmount, setProRatedAmount] = useState<number>(0);
  const [lateCreditsAmount, setLateCreditsAmount] = useState<number>(0);

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
  ];

  // Fetch User Data to get Contract Start Date
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/users/me");
        if (response.ok) {
          const user = await response.json();
          if (user.contractStartDate) {
            const startDate = new Date(user.contractStartDate);
            setContractStartDate(startDate);
            
            // Check if Late Entry
            const today = new Date();
            const isSameMonth = 
              startDate.getMonth() === today.getMonth() && 
              startDate.getFullYear() === today.getFullYear();
            
            // Late entry if start date is in current month AND today is after start date (or just implies starting now)
            // User requirement: "se for no mes corrente"
            if (isSameMonth) {
              setIsLateEntry(true);
              
              // Calculate Logic
              const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
              // Days remaining from TODAY (assuming they pay now to access now)
              // Or from Start Date? If start date is 1st and today is 20th. They missed 20 days.
              // Pro-rated should be for remaining days: today to end of month.
              const remainingDays = daysInMonth - today.getDate() + 1;
              const calculatedProRated = Math.round((monthlyPrice / 30) * remainingDays);
              setProRatedAmount(calculatedProRated > 0 ? calculatedProRated : 0);

              // Calculate Credits (Approximate missed classes)
              // Assuming 1 class per week.
              // Days missed = today.getDate() - 1.
              // Weeks missed = Math.floor(daysMissed / 7).
              // Or simple logic: 4 classes total.
              // Remaining classes = Math.floor(remainingDays / 7).
              // Missed = 4 - remaining.
              // Let's use a simpler logic: 1 credit for every 7 days missed.
              const daysMissed = today.getDate() - 1;
              const credits = Math.floor(daysMissed / 7);
              setLateCreditsAmount(credits > 0 ? credits : 1); // At least 1 if they are late enough to trigger this
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [monthlyPrice]);

  const handleMethodSelect = (method: "pix") => {
    onDataChange({ paymentMethod: method });
  };

  const processPayment = async () => {
    if (!data.paymentMethod) {
      toast.error("Selecione um método de pagamento");
      return;
    }

    if (!billingDay) {
      toast.error("Selecione um dia de vencimento");
      return;
    }

    if (isLateEntry && !lateEntryOption) {
      toast.error("Selecione uma opção de pagamento para o primeiro mês");
      return;
    }

    setIsProcessing(true);

    try {
      setProcessingMessage("Criando sua assinatura PIX...");

      const payload: any = {
        paymentMethod: data.paymentMethod,
        billingDay,
        contractLengthMonths: data.contractLengthMonths,
        contractStartDate: contractStartDate // Pass the admin defined date
      };

      if (isLateEntry) {
        if (lateEntryOption === 'pro_rated') {
          payload.initialPaymentAmount = proRatedAmount;
          payload.initialPaymentDueDate = new Date(); // Pay now
        } else if (lateEntryOption === 'full_plus_credits') {
          payload.initialPaymentAmount = monthlyPrice; // Pay full
          payload.initialPaymentDueDate = new Date(); // Pay now
          payload.addLateCredits = true;
          payload.lateCreditsAmount = lateCreditsAmount;
        }
      }

      const response = await fetch("/api/onboarding/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create subscription");
      }

      const result = await response.json();

      // PIX payment created - mark as completed and continue
      onDataChange({
        paymentCompleted: true,
        subscriptionId: result.subscription.id,
        paymentMethod: "pix",
      });
      toast.success("Assinatura PIX criada! QR Code gerado com sucesso.");
      onNext();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Erro ao processar pagamento. Tente novamente.");
      setIsProcessing(false);
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

    checkPaymentStatus();
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
            Sua assinatura PIX foi criada com sucesso! Você pode acessar o QR Code
            na área de pagamentos.
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
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>

          <Text size="xl" className="mb-4">
            Processando Pagamento
          </Text>

          <Text className="text-gray-600 dark:text-gray-300 mb-6">
            {processingMessage}
          </Text>
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

          <Text className="text-gray-600 dark:text-gray-300 mb-6">
            Escolha o melhor dia para o vencimento da sua fatura:
          </Text>

          <div className="flex flex-wrap justify-center gap-4">
            {[1, 5, 10, 12].map((day) => (
              <Button
                key={day}
                onClick={() => setBillingDay(day)}
                variant={billingDay === day ? "primary" : "outline"}
                className={`w-16 h-16 rounded-full text-lg font-bold ${
                  billingDay === day 
                    ? "ring-4 ring-primary/20 scale-110" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {day}
              </Button>
            ))}
          </div>
          {billingDay && (
            <Text size="sm" className="text-center text-gray-500 mt-4">
              A cobrança será feita todo dia {billingDay} do mês
            </Text>
          )}
        </Card>

        {/* Late Entry Options */}
        {isLateEntry && (
          <Card className="p-6 mb-8 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900/30">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
              <Text size="lg" className="font-semibold text-yellow-800 dark:text-yellow-200">
                Início das Aulas
              </Text>
            </div>
            
            <Text className="mb-6 text-yellow-800 dark:text-yellow-200">
              Como suas aulas começam no mês corrente ({contractStartDate?.toLocaleDateString()}), 
              você pode escolher como deseja realizar o primeiro pagamento:
            </Text>

            <RadioGroup 
              value={lateEntryOption || ""} 
              onValueChange={(val) => setLateEntryOption(val as any)}
              className="space-y-4"
            >
              {/* Option A: Pro-rated */}
              <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                lateEntryOption === 'pro_rated' 
                  ? 'border-yellow-500 bg-white dark:bg-gray-800' 
                  : 'border-transparent bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800'
              }`}>
                <RadioGroupItem value="pro_rated" id="pro_rated" className="mt-1" />
                <Label htmlFor="pro_rated" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    Pagar Proporcional ({formatPrice(proRatedAmount)})
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Você paga apenas pelos dias restantes deste mês. O valor integral será cobrado a partir do próximo vencimento.
                  </div>
                </Label>
              </div>

              {/* Option B: Full + Credits */}
              <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                lateEntryOption === 'full_plus_credits' 
                  ? 'border-yellow-500 bg-white dark:bg-gray-800' 
                  : 'border-transparent bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800'
              }`}>
                <RadioGroupItem value="full_plus_credits" id="full_plus_credits" className="mt-1" />
                <Label htmlFor="full_plus_credits" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    Pagar Integral ({formatPrice(monthlyPrice)}) + Ganhar Créditos
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Você paga o valor cheio do mês e recebe <strong>{lateCreditsAmount} crédito(s) de aula</strong> para repor as aulas que perdeu.
                  </div>
                  <div className="mt-2 inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">
                    Recomendado
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </Card>
        )}

        {/* Payment Method Details */}
        {data.paymentMethod && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-900/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-800 rounded-lg flex items-center justify-center">
                <Link className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
              </div>

              <div className="flex-1">
                <Text className="font-semibold mb-2">
                  Como funciona o PIX:
                </Text>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
                      1
                    </div>
                    <Text size="sm">Um QR Code será gerado para cada mensalidade</Text>
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
                    <Text size="sm">Pagamento confirmado automaticamente após o PIX</Text>
                  </div>
                </div>
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
                através do AbacatePay (PIX).
              </Text>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <div className="text-center">
          <Button
            onClick={processPayment}
            disabled={!data.paymentMethod || !billingDay || (isLateEntry && !lateEntryOption) || isProcessing || parentLoading}
            size="lg"
            isLoading={isProcessing}
            className={`px-8 py-3 font-semibold transition-all duration-200 ${
              data.paymentMethod && billingDay && (!isLateEntry || lateEntryOption)
                ? "bg-gradient-to-r from-primary/90 to-primary/70 hover:bg-primary-hover text-white"
                : "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
            }`}
          >
            {!data.paymentMethod
              ? "Selecione um método de pagamento"
              : "Criar assinatura PIX"}
          </Button>
        </div>
      </div>
    </div>
  );
};
