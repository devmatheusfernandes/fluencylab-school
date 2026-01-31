"use client";

import React from "react";
import { TeacherOnboardingStepProps } from "../../TeacherOnboardingModal"; // Ajuste o import conforme sua estrutura
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Building2, Landmark, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lista reduzida para exemplo, mantenha a completa no seu código real
const MAJOR_BANKS = [
  { code: "001", name: "Banco do Brasil" },
  { code: "033", name: "Santander" },
  { code: "104", name: "Caixa Econômica" },
  { code: "237", name: "Bradesco" },
  { code: "341", name: "Itaú" },
  { code: "260", name: "Nubank" },
  { code: "077", name: "Inter" },
];

import { BankingInfo } from "@/types/onboarding/teacher";

export const BankingInfoStep: React.FC<TeacherOnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const updateBank = (key: string, value: string) => {
    const bankingInfo = { ...data.bankingInfo, [key]: value };
    // Se selecionou banco da lista, preenche nome automaticamente
    if (key === "bankCode") {
      const bank = MAJOR_BANKS.find((b) => b.code === value);
      if (bank) bankingInfo.bankName = bank.name;
    }
    // Se mudar para PIX e o tipo for CPF, preencher a chave automaticamente se possível
    if (key === "paymentMethod" && value === "pix" && !bankingInfo.pixKeyType) {
      bankingInfo.pixKeyType = "cpf";
      if (bankingInfo.cpf) bankingInfo.pixKey = bankingInfo.cpf;
    }
    onDataChange({ bankingInfo });
  };

  const isPix = data.bankingInfo.paymentMethod === "pix";

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold flex items-center justify-center gap-2">
          <Landmark className="w-6 h-6" /> Dados de Pagamento
        </h2>
        <p className="text-sm text-gray-500">
          Escolha como deseja receber seus pagamentos.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Identificação Básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>CPF</Label>
            <Input
              value={data.bankingInfo.cpf}
              onChange={(e) => updateBank("cpf", e.target.value)}
              placeholder="000.000.000-00"
            />
          </div>
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input
              value={data.bankingInfo.fullName}
              onChange={(e) => updateBank("fullName", e.target.value)}
              placeholder="Igual ao documento"
            />
          </div>
        </div>

        {/* Seleção do Método */}
        <div className="space-y-2">
          <Label>Método de Recebimento</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={!isPix ? "glass" : "outline"}
              className={`h-20 flex flex-col gap-2 ${!isPix ? "border-primary" : "border-muted"}`}
              onClick={() => updateBank("paymentMethod", "account")}
            >
              <Building2 className="w-6 h-6 mr-2" />
              <span>Conta Bancária</span>
            </Button>
            <Button
              variant={isPix ? "glass" : "outline"}
              className={`h-20 flex flex-col gap-2 ${isPix ? "border-primary" : "border-muted"}`}
              onClick={() => updateBank("paymentMethod", "pix")}
            >
              <QrCode className="w-6 h-6 mr-2" />
              <span>PIX</span>
            </Button>
          </div>
        </div>

        {/* Formulário Condicional */}
        {isPix ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 p-4 bg-muted/30 rounded-lg border">
            <div className="space-y-2">
              <Label>Tipo de Chave PIX</Label>
              <Select
                value={data.bankingInfo.pixKeyType}
                onValueChange={(v) => updateBank("pixKeyType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="random">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input
                value={data.bankingInfo.pixKey || ""}
                onChange={(e) => updateBank("pixKey", e.target.value)}
                placeholder={
                  data.bankingInfo.pixKeyType === "email"
                    ? "seu@email.com"
                    : data.bankingInfo.pixKeyType === "phone"
                      ? "(00) 00000-0000"
                      : data.bankingInfo.pixKeyType === "random"
                        ? "Chave aleatória"
                        : "Digite sua chave"
                }
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banco</Label>
                <Select
                  value={data.bankingInfo.bankCode}
                  onValueChange={(v) => updateBank("bankCode", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAJOR_BANKS.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.code} - {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <Select
                  value={data.bankingInfo.accountType}
                  onValueChange={(v) => updateBank("accountType", v as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Corrente</SelectItem>
                    <SelectItem value="savings">Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label>Agência (sem dígito)</Label>
                <Input
                  value={data.bankingInfo.agency}
                  onChange={(e) => updateBank("agency", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Conta</Label>
                <Input
                  value={data.bankingInfo.accountNumber}
                  onChange={(e) => updateBank("accountNumber", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Dígito</Label>
                <Input
                  value={data.bankingInfo.accountDigit}
                  onChange={(e) => updateBank("accountDigit", e.target.value)}
                  className="md:w-20"
                />
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
