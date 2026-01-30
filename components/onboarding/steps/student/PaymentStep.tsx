"use client";

import React, { useState, useEffect } from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPrice } from "@/config/pricing";
import { QrCode, Calendar, CheckCircle } from "lucide-react";

export const PaymentStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
  onNext
}) => {
  const [billingDay, setBillingDay] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const basePrice = 29900;
  const price = data.contractLengthMonths === 12 ? Math.round(basePrice * 0.85) : basePrice;

  const handleCreateSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "pix",
          billingDay,
          contractLengthMonths: data.contractLengthMonths
        }),
      });

      if (!res.ok) throw new Error("Erro");
      const result = await res.json();

      onDataChange({ paymentCompleted: true, subscriptionId: result.subscription.id, paymentMethod: "pix" });
      toast.success("QR Code Gerado!");
      onNext();
    } catch {
      toast.error("Erro ao gerar pagamento.");
    } finally {
      setLoading(false);
    }
  };

  if (data.paymentCompleted) {
     return (
        <div className="flex flex-col items-center justify-center p-8 text-center h-64">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
            <Text variant="title">Pagamento Iniciado!</Text>
            <Text>Seu PIX foi gerado. Finalize para ver o código.</Text>
        </div>
     )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <Text variant="title">Configurar Pagamento</Text>
        <Text size="2xl" className="font-bold text-primary mt-2">{formatPrice(price)}<span className="text-sm font-normal text-gray-500">/mês</span></Text>
      </div>

      <Card className="p-4 border-primary/50 bg-primary/5">
        <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-lg"><QrCode className="w-8 h-8"/></div>
            <div>
                <Text className="font-bold">Pagamento via PIX</Text>
                <Text size="sm" className="text-gray-600">Sem cartão de crédito. Simples e rápido.</Text>
            </div>
        </div>
      </Card>

      <div>
        <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-gray-500"/>
            <Text className="font-medium">Melhor dia para vencimento:</Text>
        </div>
        <div className="grid grid-cols-4 gap-3">
            {[1, 5, 10, 15].map(day => (
                <Button 
                    key={day} 
                    variant={billingDay === day ? "primary" : "outline"}
                    onClick={() => setBillingDay(day)}
                    className="h-12 text-lg"
                >
                    {day}
                </Button>
            ))}
        </div>
        <Text size="xs" className="text-center mt-2 text-gray-500">A fatura chegará no seu email 2 dias antes.</Text>
      </div>

      <Button onClick={handleCreateSubscription} isLoading={loading} className="w-full py-6 text-lg">
        Gerar Assinatura PIX
      </Button>
    </div>
  );
};