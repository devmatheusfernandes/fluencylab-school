// components/onboarding/steps/teacher/BankingInfoStep.tsx
"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, CheckCircle2, User, Calendar } from "lucide-react";

export interface BankingInfo {
  accountType: "checking" | "savings";
  bankCode: string;
  bankName: string;
  agency: string;
  accountNumber: string;
  accountDigit: string;
  cpf: string;
  fullName: string;
}

interface BankingInfoStepProps {
  data: BankingInfo;
  onDataChange: (updates: Partial<BankingInfo>) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const MAJOR_BANKS = [
  { code: "001", name: "Banco do Brasil" },
  { code: "033", name: "Santander" },
  { code: "104", name: "Caixa Econômica Federal" },
  { code: "237", name: "Bradesco" },
  { code: "341", name: "Itaú" },
  { code: "260", name: "Nu Pagamentos (Nubank)" },
  { code: "077", name: "Banco Inter" },
  { code: "212", name: "Banco Original" },
  { code: "290", name: "PagSeguro" },
  { code: "323", name: "Mercado Pago" },
];

export const BankingInfoStep: React.FC<BankingInfoStepProps> = ({
  data,
  onDataChange,
  onNext,
  onBack,
  isLoading,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, "");
    if (cleanCPF.length !== 11) return false;
    
    // Check for repeated digits
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validate check digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;
    
    return digit1 === parseInt(cleanCPF[9]) && digit2 === parseInt(cleanCPF[10]);
  };

  const formatCPF = (value: string): string => {
    const cleanValue = value.replace(/\D/g, "");
    return cleanValue
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const handleInputChange = (field: keyof BankingInfo, value: string) => {
    let processedValue = value;
    
    if (field === "cpf") {
      processedValue = formatCPF(value);
    } else if (field === "agency" || field === "accountNumber") {
      processedValue = value.replace(/\D/g, "");
    }
    
    onDataChange({ [field]: processedValue });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!data.fullName.trim()) {
      newErrors.fullName = "Nome completo é obrigatório";
    }
    
    if (!data.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!validateCPF(data.cpf)) {
      newErrors.cpf = "CPF inválido";
    }
    
    if (!data.bankCode) {
      newErrors.bankCode = "Selecione um banco";
    }
    
    if (!data.agency.trim()) {
      newErrors.agency = "Agência é obrigatória";
    }
    
    if (!data.accountNumber.trim()) {
      newErrors.accountNumber = "Número da conta é obrigatório";
    }
    
    if (!data.accountType) {
      newErrors.accountType = "Tipo de conta é obrigatório";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const selectedBank = MAJOR_BANKS.find(bank => bank.code === data.bankCode);

  return (
    <div className="flex-1 px-8 py-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <Text variant="title" size="xl" weight="bold" className="mb-2">
            Informações Bancárias
          </Text>
          <Text variant="subtitle"   className="max-w-2xl mx-auto">
            Para receber seus pagamentos, precisamos das suas informações bancárias.
            Todos os dados são criptografados e seguros.
          </Text>
        </div>

        {/* Security Notice */}
        <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <Text   size="sm" weight="medium" className="text-blue-800 dark:text-blue-200 mb-1">
                Segurança dos seus dados
              </Text>
              <Text   size="sm" className="text-blue-700 dark:text-blue-300">
                Suas informações bancárias são criptografadas e armazenadas com segurança.
                Utilizamos os mesmos padrões de segurança dos bancos.
              </Text>
            </div>
          </div>
        </Card>

        {/* Form */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <Text    weight="semibold">
                  Dados Pessoais
                </Text>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Nome Completo *
              </label>
              <Input
                value={data.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder="Seu nome completo como no documento"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                CPF *
              </label>
              <Input
                value={data.cpf}
                onChange={(e) => handleInputChange("cpf", e.target.value)}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            {/* Banking Information */}
            <div className="md:col-span-2 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <Text     weight="semibold">
                  Dados Bancários
                </Text>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Banco *
              </label>
              <Select
                value={data.bankCode}
                onValueChange={(value) => {
                  const bank = MAJOR_BANKS.find(b => b.code === value);
                  onDataChange({ 
                    bankCode: value,
                    bankName: bank?.name || ""
                  });
                }}
              >
                <SelectTrigger >
                  <SelectValue placeholder="Selecione seu banco" />
                </SelectTrigger>
                <SelectContent>
                  {MAJOR_BANKS.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bankCode && (
                <Text   size="sm" className="text-red-600 mt-1">
                  {errors.bankCode}
                </Text>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tipo de Conta *
              </label>
              <Select
                value={data.accountType}
                onValueChange={(value) => onDataChange({ accountType: value as "checking" | "savings" })}
              >
                <SelectTrigger >
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Conta Poupança</SelectItem>
                </SelectContent>
              </Select>
              {errors.accountType && (
                <Text   size="sm" className="text-red-600 mt-1">
                  {errors.accountType}
                </Text>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Agência *
              </label>
              <Input
                value={data.agency}
                onChange={(e) => handleInputChange("agency", e.target.value)}
                placeholder="0000"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  Número da Conta *
                </label>
                <Input
                  value={data.accountNumber}
                  onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                  placeholder="00000000"
                />
              </div>
              <div className="w-20">
                <label className="block text-sm font-medium mb-2">
                  Dígito
                </label>
                <Input
                  value={data.accountDigit}
                  onChange={(e) => handleInputChange("accountDigit", e.target.value)}
                  placeholder="0"
                  maxLength={1}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {selectedBank && data.agency && data.accountNumber && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <Text   size="sm" weight="medium" className="text-green-800 dark:text-green-200 mb-1">
                    Resumo dos dados bancários
                  </Text>
                  <Text   size="sm" className="text-green-700 dark:text-green-300">
                    {selectedBank.name} • Agência: {data.agency} • Conta: {data.accountNumber}
                    {data.accountDigit && `-${data.accountDigit}`} • {data.accountType === "checking" ? "Corrente" : "Poupança"}
                  </Text>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="secondary"
            onClick={onBack}
            disabled={isLoading}
          >
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            disabled={isLoading}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
};
