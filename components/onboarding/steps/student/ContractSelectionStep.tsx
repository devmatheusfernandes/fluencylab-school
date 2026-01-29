// components/onboarding/steps/ContractSelectionStep.tsx
"use client";

import React, { useState, useEffect } from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { formatPrice } from "@/config/pricing";
import { useSession } from "next-auth/react";
import { ChevronDown, HandCoins, Info, Link, Banknote } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface ContractOptionProps {
  duration: 6 | 12;
  title: string;
  description: string;
  monthlyPrice: number;
  totalPrice: number;
  savings?: number;
  benefits: string[];
  popular?: boolean;
  selected: boolean;
  onSelect: () => void;
}

const ContractOption: React.FC<ContractOptionProps> = ({
  duration,
  title,
  description,
  monthlyPrice,
  totalPrice,
  savings,
  benefits,
  popular,
  selected,
  onSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card
      className={`relative p-6 cursor-pointer ease-in-out transition-all duration-300 ${
        selected
          ? "!border-1 !border-primary !bg-primary/5 dark:bg-primary/30 transform scale-103"
          : "!bg-white/10 !border-3"
      } ${popular ? "" : ""}`}
      onClick={onSelect}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-secondary text-white font-bold px-4 py-2">
            MAIS POPULAR
          </Badge>
        </div>
      )}

      <div className="text-center mb-6">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            selected
              ? "bg-indigo-100 dark:bg-indigo-800"
              : "bg-gray-100 dark:bg-gray-700"
          }`}
        >
          <Banknote
            className={`w-8 h-8 ${
              selected
                ? "text-success dark:text-success"
                : "text-gray-600 dark:text-gray-300"
            }`}
          />
        </div>

        <Text variant="title">{title}</Text>
        <Text
          className={`mt-2 ${selected ? "text-paragraph" : "text-paragraph"}`}
        >
          {description}
        </Text>
      </div>

      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Text
            size="3xl"
            className={`font-bold ${selected ? "text-primary" : ""}`}
          >
            {formatPrice(monthlyPrice)}
          </Text>
          <Text className="text-paragraph">/mês</Text>
        </div>

        <div className="space-y-1">
          {savings && (
            <div className="flex items-center justify-center gap-1">
              <Text size="sm" className="text-success font-medium">
                Economiza {formatPrice(savings)}
              </Text>
              <HandCoins
                className="w-4 h-4 text-success"
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {benefits
          .slice(0, isExpanded ? benefits.length : 3)
          .map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <Info
                className="w-5 h-5 text-primary"
              />
              <Text
                size="sm"
                className={selected ? "text-paragraph" : "text-paragraph"}
              >
                {benefit}
              </Text>
            </div>
          ))}
      </div>

      {benefits.length > 3 && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={`flex flex-row items-center justify-center gap-2 w-full mb-4 ${selected ? "text-primary hover:text-primary-hover" : ""}`}
        >
          {isExpanded
            ? "Ver menos"
            : `Ver mais ${benefits.length - 3} benefícios`}
          <ChevronDown
            className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      )}

      <div
        className={`text-center p-3 rounded-lg ${
          selected ? "bg-primary/30" : "bg-gray-100 dark:bg-gray-700/50"
        }`}
      >
        <Text
          size="sm"
          className={`font-medium ${
            selected ? "text-title" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          {selected ? "✓ Plano Selecionado" : "Clique para selecionar"}
        </Text>
      </div>
    </Card>
  );
};

export const ContractSelectionStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
  onNext,
}) => {
  const [isCheckingContract, setIsCheckingContract] = useState(true);
  const [contractStartDate, setContractStartDate] = useState<Date | null>(null);
  const basePrice = 29900; // in centavos

  // Fetch user data to get contractStartDate
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/users/me");
        if (response.ok) {
          const userData = await response.json();
          if (userData.contractStartDate) {
            // Handle both ISO string and Firestore timestamp
            const dateValue = userData.contractStartDate;
            const date = typeof dateValue === 'object' && '_seconds' in dateValue 
              ? new Date(dateValue._seconds * 1000)
              : new Date(dateValue);
            setContractStartDate(date);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  // Check if contract is already signed when component mounts
  useEffect(() => {
    const checkContractStatus = async () => {
      if (data.contractSigned) {
        setIsCheckingContract(false);
        return;
      }

      try {
        const response = await fetch("/api/onboarding/contract-status");
        if (response.ok) {
          const result = await response.json();
          if (result.contractSigned) {
            onDataChange({
              contractSigned: true,
              contractData: result.contractData,
            });
            // Automatically proceed to next step if contract is already signed
            onNext();
            return;
          }
        }
      } catch (error) {
        console.error("Error checking contract status:", error);
        // Continue with normal flow if check fails
      } finally {
        setIsCheckingContract(false);
      }
    };

    checkContractStatus();
  }, [data.contractSigned, onDataChange, onNext]);

  const contractOptions = [
    {
      duration: 6 as const,
      title: "Plano Semestral",
      description: "Ideal para objetivos de curto prazo",
      monthlyPrice: basePrice,
      totalPrice: basePrice * 6,
      benefits: [
        "Aulas semanais personalizadas",
        "Material didático incluído",
        "Suporte técnico completo",
        "Relatórios mensais de progresso",
        "Acesso à plataforma 24/7",
        "Certificado de participação",
      ],
      popular: false,
    },
    {
      duration: 12 as const,
      title: "Plano Anual",
      description: "Melhor custo-benefício para fluência",
      monthlyPrice: Math.round(basePrice * 0.85), // 15% discount
      totalPrice: Math.round(basePrice * 0.85) * 12,
      savings: basePrice * 12 - Math.round(basePrice * 0.85) * 12,
      benefits: [
        "Aulas semanais personalizadas",
        "Material didático incluído",
        "Suporte técnico completo",
        "Relatórios mensais de progresso",
        "Acesso à plataforma 24/7",
        "Certificado de conclusão",
        "15% de desconto no valor mensal",
        "Aulas de conversação extras",
        "Avaliação de proficiência inclusa",
        "Suporte prioritário",
      ],
      popular: true,
    },
  ];

  const selectedOption = contractOptions.find(
    (option) => option.duration === data.contractLengthMonths
  );

  const handleSelect = (duration: 6 | 12) => {
    onDataChange({ contractLengthMonths: duration });
  };

  // Show loading state while checking contract status
  if (isCheckingContract) {
    return (
      <div className="py-2">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <Spinner />
            <Text variant="title">Verificando Status do Contrato</Text>
            <Text size="lg" className="text-gray-600 dark:text-gray-300 mb-8">
              Aguarde enquanto verificamos se você já possui um contrato assinado...
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-4">
            <Link className="w-8 h-8 text-white" />
          </div>

          <Text variant="title">Escolha a Duração do seu Contrato</Text>
          <Text
            size="lg"
            className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6"
          >
            Selecione o plano que melhor se adapta aos seus objetivos de
            aprendizado. Ambos os planos incluem as mesmas funcionalidades
            principais.
          </Text>

          {contractStartDate && (
            <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg inline-block border border-blue-200 dark:border-blue-800">
              <Text className="font-semibold text-blue-800 dark:text-blue-200">
                Data de Início das Aulas: {contractStartDate.toLocaleDateString()}
              </Text>
              <Text size="sm" className="text-blue-600 dark:text-blue-300 mt-1">
                Seu contrato terá validade a partir desta data.
              </Text>
            </div>
          )}
        </div>

        {/* Contract Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {contractOptions.map((option) => (
            <ContractOption
              key={option.duration}
              {...option}
              selected={data.contractLengthMonths === option.duration}
              onSelect={() => handleSelect(option.duration)}
            />
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="p-6 mb-8">
          <Text variant="title" className="text-center mb-6">
            Comparação Detalhada
          </Text>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4">Benefício</th>
                  <th className="text-center py-3 px-4">Plano Semestral</th>
                  <th className="text-center py-3 px-4">Plano Anual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                <tr>
                  <td className="py-3 px-4 font-medium">Preço mensal</td>
                  <td className="text-center py-3 px-4">
                    {formatPrice(basePrice)}
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="flex flex-col items-center">
                      <span className="text-green-600 font-bold">
                        {formatPrice(Math.round(basePrice * 0.85))}
                      </span>
                      <span className="text-xs text-gray-500 line-through">
                        {formatPrice(basePrice)}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Economia total</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4 text-green-600 font-bold">
                    {formatPrice(
                      basePrice * 12 - Math.round(basePrice * 0.85) * 12
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">
                    Aulas extras de conversação
                  </td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">
                    Avaliação de proficiência
                  </td>
                  <td className="text-center py-3 px-4">Pago à parte</td>
                  <td className="text-center py-3 px-4">✅ Incluso</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Suporte prioritário</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Selected Plan Summary */}
        {selectedOption && (
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-700 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                  <Link className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <Text className="font-semibold text-blue-900 dark:text-blue-100">
                    Plano Selecionado: {selectedOption.title}
                  </Text>
                  <Text size="sm" className="text-blue-700 dark:text-blue-200">
                    {selectedOption.duration} meses •{" "}
                    {formatPrice(selectedOption.monthlyPrice)}/mês
                    {selectedOption.savings &&
                      ` • Economiza ${formatPrice(selectedOption.savings)}`}
                  </Text>
                </div>
              </div>

              <div className="text-right">
                <Text size="sm" className="text-blue-600 dark:text-blue-300">
                  Total do contrato
                </Text>
                <Text
                  size="xl"
                  className="font-bold text-blue-900 dark:text-blue-100"
                >
                  {formatPrice(selectedOption.totalPrice)}
                </Text>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
