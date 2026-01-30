"use client";

import React, { useEffect } from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { formatPrice } from "@/config/pricing";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export const ContractSelectionStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
  onNext
}) => {
  const basePrice = 29900; // Centavos

  // Verificação rápida de contrato existente
  useEffect(() => {
    if (data.contractSigned) onNext();
  }, [data.contractSigned, onNext]);

  const plans = [
    {
      months: 6,
      label: "Semestral",
      price: basePrice,
      badge: null
    },
    {
      months: 12,
      label: "Anual",
      price: Math.round(basePrice * 0.85),
      badge: "Mais Vantajoso (-15%)"
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <Text variant="title">Escolha seu Plano</Text>
        <Text className="text-gray-500">Qualidade igual, preço melhor no longo prazo.</Text>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => {
          const isSelected = data.contractLengthMonths === plan.months;
          return (
            <Card
              key={plan.months}
              onClick={() => onDataChange({ contractLengthMonths: plan.months as 6 | 12 })}
              className={`p-4 cursor-pointer transition-all border-2 relative ${
                isSelected 
                  ? "border-primary bg-primary/5 dark:bg-primary/20" 
                  : "border-transparent hover:border-gray-200"
              }`}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 right-4 bg-green-600 hover:bg-green-700">
                  {plan.badge}
                </Badge>
              )}
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary' : 'border-gray-300'}`}>
                    {isSelected && <div className="w-3 h-3 bg-primary rounded-full" />}
                  </div>
                  <div>
                    <Text className="font-bold text-lg">{plan.label}</Text>
                    <Text size="sm" className="text-gray-500">{plan.months} meses de contrato</Text>
                  </div>
                </div>
                
                <div className="text-right">
                  <Text className="font-bold text-xl">{formatPrice(plan.price)}</Text>
                  <Text size="xs" className="text-gray-500">/mês</Text>
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 flex flex-col gap-1">
                  <div className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500"/> Material Incluso</div>
                  <div className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500"/> Aulas personalizadas</div>
                  {plan.months === 12 && <div className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500"/> Avaliação de proficiência inclusa</div>}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};