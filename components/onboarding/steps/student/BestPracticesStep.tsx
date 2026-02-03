"use client";

import React from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import {
  Clock,
  CalendarX,
  Wallet,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

export const BestPracticesStep: React.FC<OnboardingStepProps> = () => {
  const rules = [
    {
      icon: <Clock className="w-5 h-5 text-blue-500" />,
      title: "Pontualidade & Autonomia",
      text: "Entre na sala de aula no horário marcado. Não espere mensagem do professor. Tolerância máxima de 10 minutos.",
    },
    {
      icon: <CalendarX className="w-5 h-5 text-orange-500" />,
      title: "Reagendamentos",
      text: "Imprevistos acontecem. Você tem direito a 2 reagendamentos por mês, desde que avise com 24h de antecedência.",
    },
    {
      icon: <Wallet className="w-5 h-5 text-green-500" />,
      title: "Financeiro",
      text: "O vencimento é entre o dia 1º e 10 de cada mês. O reajuste da mensalidade ocorre anualmente em Julho.",
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      title: "Cancelamento",
      text: "Para cancelar sem multa, é necessário aviso prévio de 30 dias.",
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto max-h-[50vh] overflow-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <Text variant="title">Regras de Ouro</Text>
        <Text className="text-gray-500 text-sm">
          Para garantir a melhor experiência para você e seu professor.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule, idx) => (
          <Card
            key={idx}
            className="p-4 flex gap-4 items-start border-l-4 border-l-primary/20 hover:border-l-primary transition-all"
          >
            <div className="mt-1 flex-shrink-0 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
              {rule.icon}
            </div>
            <div>
              <Text className="font-bold text-gray-900 dark:text-gray-100">
                {rule.title}
              </Text>
              <Text
                size="sm"
                className="text-gray-600 dark:text-gray-400 leading-relaxed mt-1"
              >
                {rule.text}
              </Text>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg text-xs text-center text-yellow-800 dark:text-yellow-200">
        Ao prosseguir, você concorda com estas diretrizes de convivência.
      </div>
    </div>
  );
};
