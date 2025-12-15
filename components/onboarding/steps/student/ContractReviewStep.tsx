// components/onboarding/steps/ContractReviewStep.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import ContratoPDF from "@/components/contract/ContratoPDF";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { formatPrice } from "@/config/pricing";
import { Spinner } from "@/components/ui/spinner";
import { SignatureFormData } from "@/types/contract";
import { Link, Square } from "lucide-react";

export const ContractReviewStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
  onNext,
  isLoading: parentLoading,
}) => {
  const { data: session } = useSession();
  const [showContract, setShowContract] = useState(false);
  const [isSigningMode, setIsSigningMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingContract, setIsCheckingContract] = useState(true);
  const [formData, setFormData] = useState<SignatureFormData>({
    cpf: "",
    name: session?.user?.name || "",
    birthDate: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    agreedToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const contractScrollRef = useRef<HTMLDivElement>(null);

  // Get pricing based on user role and contract length
  const isGuardedStudent = session?.user?.role === "GUARDED_STUDENT";
  const basePrice = isGuardedStudent ? 39900 : 29900;
  const monthlyPrice =
    data.contractLengthMonths === 12 ? Math.round(basePrice * 0.85) : basePrice;
  const totalPrice = monthlyPrice * data.contractLengthMonths;

  const contractSummary = {
    duration: data.contractLengthMonths,
    monthlyPrice,
    totalPrice,
    studentType: isGuardedStudent
      ? "Estudante Acompanhado"
      : "Estudante Regular",
    savings:
      data.contractLengthMonths === 12 ? basePrice * 12 - monthlyPrice * 12 : 0,
  };

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
  }, [data.contractSigned, onDataChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "cpf") {
      // Format CPF as user types
      const formattedCpf = value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      setFormData((prev) => ({ ...prev, [name]: formattedCpf }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (errors.agreedToTerms) {
      setErrors((prev) => ({ ...prev, agreedToTerms: "" }));
    }
    setFormData((prev) => ({ ...prev, agreedToTerms: checked }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido";
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "Data de nascimento é obrigatória";
    } else if (!isAdult(formData.birthDate)) {
      newErrors.birthDate = "É necessário ter 18 anos ou mais";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Endereço é obrigatório";
    }

    if (!formData.city.trim()) {
      newErrors.city = "Cidade é obrigatória";
    }

    if (!formData.state.trim()) {
      newErrors.state = "Estado é obrigatório";
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "CEP é obrigatório";
    }

    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = "Você deve concordar com os termos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCPF = (cpf: string): boolean => {
    const cleanCpf = cpf.replace(/[^\d]+/g, "");
    if (cleanCpf.length !== 11 || /^(\d)\1{10}$/.test(cleanCpf)) {
      return false;
    }

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;

    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cleanCpf.substring(9, 10))) {
      return false;
    }

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;

    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cleanCpf.substring(10, 11))) {
      return false;
    }

    return true;
  };

  const isAdult = (birthDateString: string): boolean => {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const handleSignContract = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Sign the contract (IP and browser info will be handled server-side)
      const response = await fetch("/api/onboarding/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureData: formData,
          contractLengthMonths: data.contractLengthMonths,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to sign contract");
      }

      const result = await response.json();

      // Update onboarding data
      onDataChange({
        contractSigned: true,
        contractData: result.contractStatus,
      });

      toast.success("Contrato assinado com sucesso!");
      onNext();
    } catch (error) {
      console.error("Error signing contract:", error);
      toast.error("Erro ao assinar o contrato. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking contract status
  if (isCheckingContract) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-2xl mx-auto">
          <Spinner />
          <Text variant="title">Verificando Status do Contrato</Text>

          <Text size="lg" className="text-gray-600 dark:text-gray-300 mb-8">
            Aguarde enquanto verificamos se você já possui um contrato
            assinado...
          </Text>
        </div>
      </div>
    );
  }

  if (data.contractSigned) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full mb-3">
            <Square
              className="w-8 h-8 text-green-600 dark:text-green-300"
            />
          </div>

          <Text variant="title">Contrato assinado com sucesso!</Text>

          <Text size="lg" className="text-green-700 dark:text-green-200 mb-8">
            Seu contrato foi processado e está válido. Agora vamos para o
            pagamento!
          </Text>

          <Button onClick={onNext} size="lg" variant="success">
            Prosseguir para pagamento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4">
            <Link className="w-8 h-8 text-white" />
          </div>

          <Text variant="title">Revisão e Assinatura do Contrato</Text>
          <Text size="lg" className="text-gray-600 dark:text-gray-300">
            Revise os termos do seu contrato e preencha seus dados para a
            assinatura digital.
          </Text>
        </div>

        {/* Contract Summary */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700">
          <Text variant="title">Resumo do Seu Contrato</Text>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Link className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                <div>
                  <Text className="font-medium">Duração do Contrato</Text>
                  <Text size="sm" className="text-gray-600 dark:text-gray-300">
                    {contractSummary.duration} meses
                  </Text>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                <div>
                  <Text className="font-medium">Tipo de Estudante</Text>
                  <Text size="sm" className="text-gray-600 dark:text-gray-300">
                    {contractSummary.studentType}
                  </Text>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Link className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                <div>
                  <Text className="font-medium">Valor Mensal</Text>
                  <Text size="sm" className="text-gray-600 dark:text-gray-300">
                    {formatPrice(contractSummary.monthlyPrice)}
                    {contractSummary.savings > 0 && (
                      <span className="text-green-600 ml-2">
                        (Economia de {formatPrice(contractSummary.savings)})
                      </span>
                    )}
                  </Text>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                <div>
                  <Text className="font-medium">Valor Total do Contrato</Text>
                  <Text size="sm" className="text-gray-600 dark:text-gray-300">
                    {formatPrice(contractSummary.totalPrice)}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Contract View Toggle */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={() => setShowContract(!showContract)}
            className="flex items-center gap-2"
          >
            {showContract ? "Ocultar" : "Visualizar"} Contrato Completo
          </Button>
        </div>

        {/* Contract Display */}
        {showContract && (
          <Card
            className="mb-8 max-h-96 overflow-y-auto"
            ref={contractScrollRef}
          >
            <ContratoPDF
              alunoData={{
                id: session?.user?.id || "",
                name: formData.name || session?.user?.name || "",
                email: session?.user?.email || "",
                cpf: formData.cpf,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
                birthDate: formData.birthDate,
              }}
              contractStatus={null}
            />
          </Card>
        )}

        {!isSigningMode ? (
          /* Review Mode */
          <div className="text-center">
            <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Link className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
                <Text className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Leia com atenção
                </Text>
              </div>
              <Text className="text-yellow-700 dark:text-yellow-200">
                Por favor, leia cuidadosamente todos os termos do contrato antes
                de prosseguir com a assinatura. Este documento estabelece os
                direitos e deveres de ambas as partes.
              </Text>
            </Card>

            <Button
              onClick={() => setIsSigningMode(true)}
              size="lg"
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold"
            >
              <Link className="w-5 h-5 mr-2" />
              Quero assinar o contrato
            </Button>
          </div>
        ) : (
          /* Signature Mode */
          <Card className="p-8">
            <Text variant="title">Dados para Assinatura Digital</Text>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome Completo *
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Seu nome completo"
                  hasError={!!errors.name}
                />
                {errors.name && (
                  <Text size="sm" className="text-red-500 mt-1">
                    {errors.name}
                  </Text>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CPF *</label>
                <Input
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  placeholder="000.000.000-00"
                  hasError={!!errors.cpf}
                />
                {errors.cpf && (
                  <Text size="sm" className="text-red-500 mt-1">
                    {errors.cpf}
                  </Text>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Data de Nascimento *
                </label>
                <Input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  hasError={!!errors.birthDate}
                />
                {errors.birthDate && (
                  <Text size="sm" className="text-red-500 mt-1">
                    {errors.birthDate}
                  </Text>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CEP *</label>
                <Input
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  placeholder="00000-000"
                  hasError={!!errors.zipCode}
                />
                {errors.zipCode && (
                  <Text size="sm" className="text-red-500 mt-1">
                    {errors.zipCode}
                  </Text>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Endereço Completo *
                </label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Rua, número, complemento"
                  hasError={!!errors.address}
                />
                {errors.address && (
                  <Text size="sm" className="text-red-500 mt-1">
                    {errors.address}
                  </Text>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Cidade *
                </label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Sua cidade"
                  hasError={!!errors.city}
                />
                {errors.city && (
                  <Text size="sm" className="text-red-500 mt-1">
                    {errors.city}
                  </Text>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Estado *
                </label>
                <Input
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="Seu estado"
                  hasError={!!errors.state}
                />
                {errors.state && (
                  <Text size="sm" className="text-red-500 mt-1">
                    {errors.state}
                  </Text>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={formData.agreedToTerms}
                  onCheckedChange={handleCheckboxChange}
                />
                <div>
                  <Text size="sm">Ao marcar esta caixa, eu confirmo que:</Text>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 mt-2 space-y-1 ml-4">
                    <li>• Li e compreendi todos os termos do contrato</li>
                    <li>
                      • Concordo com as condições de prestação de serviços
                    </li>
                    <li>• As informações fornecidas são verdadeiras</li>
                    <li>
                      • Autorizo o início da prestação dos serviços educacionais
                    </li>
                  </ul>
                  {errors.agreedToTerms && (
                    <Text size="sm" className="text-red-500 mt-2">
                      {errors.agreedToTerms}
                    </Text>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setIsSigningMode(false)}
                disabled={isSubmitting}
                variant="ghost"
              >
                Voltar para Revisão
              </Button>

              <Button
                onClick={handleSignContract}
                disabled={!formData.agreedToTerms || isSubmitting}
                isLoading={isSubmitting}
                variant="success"
              >
                Assinar Contrato
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
