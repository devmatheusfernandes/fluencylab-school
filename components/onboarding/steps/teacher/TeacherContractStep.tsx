"use client";

import React, { useState, useRef, useEffect } from "react";
import { TeacherOnboardingStepProps } from "../../TeacherOnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TeacherContractPDF } from "./TeacherContractPDF";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Link, Square, FileSignature, CheckCircle } from "lucide-react";

export const TeacherContractStep: React.FC<TeacherOnboardingStepProps> = ({
  data,
  onDataChange,
  onNext,
  isLoading: parentLoading,
}) => {
  const { data: session } = useSession();
  const [showContract, setShowContract] = useState(false);
  const [isSigningMode, setIsSigningMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: data.bankingInfo.fullName || session?.user?.name || "",
    cnpj: "", // Initializing empty as requested for CNPJ
    address: "",
    city: "",
    state: "",
    zipCode: "",
    agreedToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const contractScrollRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "cnpj") {
      // CNPJ Mask: XX.XXX.XXX/XXXX-XX
      const formattedCnpj = value
        .replace(/\D/g, "") // Remove non-digits
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 18); // Limit length
      setFormData((prev) => ({ ...prev, [name]: formattedCnpj }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!formData.cnpj.trim()) {
      newErrors.cnpj = "CNPJ é obrigatório";
    } else if (formData.cnpj.replace(/\D/g, "").length !== 14) {
      newErrors.cnpj = "CNPJ inválido";
    }
    if (!formData.address.trim()) newErrors.address = "Endereço é obrigatório";
    if (!formData.city.trim()) newErrors.city = "Cidade é obrigatória";
    if (!formData.state.trim()) newErrors.state = "Estado é obrigatório";
    if (!formData.zipCode.trim()) newErrors.zipCode = "CEP é obrigatório";
    if (!formData.agreedToTerms) newErrors.agreedToTerms = "Você deve concordar com os termos";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignContract = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Map CNPJ to cpf field for backend compatibility
      const payload = {
          ...formData,
          cpf: formData.cnpj
      };

      const response = await fetch("/api/onboarding/teacher/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureData: payload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to sign contract");
      }

      // Update onboarding data
      onDataChange({
        contractSigned: true
      });

      toast.success("Contrato assinado com sucesso!");
    } catch (error) {
      console.error("Error signing contract:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao assinar o contrato. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <FileSignature className="w-8 h-8 text-white" />
          </div>

          <Text variant="title">Contrato de Parceria</Text>
          <Text size="lg" className="text-gray-600 dark:text-gray-300">
            Revise os termos do contrato de prestação de serviços e parceria comercial.
          </Text>
        </div>

        {/* Contract Preview Card */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <Text className="font-medium text-lg mb-1">Modelo de Contrato</Text>
                    <Text size="sm" className="text-gray-600 dark:text-gray-300">
                        Prestação de Serviços de Instrutoria Educacional
                    </Text>
                </div>
                <Button
                    onClick={() => setShowContract(!showContract)}
                    variant="outline"
                    className="w-full md:w-auto"
                >
                    {showContract ? "Ocultar Contrato" : "Ler Contrato Completo"}
                </Button>
            </div>
        </Card>

        {showContract && (
          <Card
            className="mb-8 max-h-96 overflow-y-auto"
            ref={contractScrollRef}
          >
            <TeacherContractPDF
              teacherName={formData.name}
              teacherCnpj={formData.cnpj}
              teacherAddress={formData.address}
              teacherCity={formData.city}
              teacherState={formData.state}
              teacherZipCode={formData.zipCode}
            />
          </Card>
        )}

        {data.contractSigned ? (
          <div className="text-center">
            <Card className="p-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 mb-6">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <Text variant="title" size="lg" className="text-green-800 dark:text-green-200 mb-2">
                    Contrato Assinado com Sucesso
                  </Text>
                  <Text className="text-green-700 dark:text-green-300">
                    O contrato foi registrado e vinculado à sua conta.
                  </Text>
                </div>
              </div>
            </Card>
            <Button onClick={onNext} size="lg" className="px-8 bg-green-600 hover:bg-green-700 text-white">
              Continuar para Próxima Etapa
            </Button>
          </div>
        ) : !isSigningMode ? (
          <div className="text-center">
             <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Link className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
                <Text className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Importante
                </Text>
              </div>
              <Text className="text-yellow-700 dark:text-yellow-200">
                Ao assinar este contrato, você estabelece uma parceria comercial com a Fluency Lab como prestador de serviços autônomo (MEI).
              </Text>
            </Card>
            <Button
              onClick={() => setIsSigningMode(true)}
              size="lg"
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold"
            >
              <FileSignature className="w-5 h-5 mr-2" />
              Preencher e Assinar
            </Button>
          </div>
        ) : (
          <Card className="p-8">
            <Text variant="title">Dados da Contratada (Você)</Text>
            <Text size="sm" className="text-gray-500 mb-6">Preencha com seus dados pessoais ou da sua empresa (MEI)</Text>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Nome Completo / Razão Social *</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  hasError={!!errors.name}
                />
                {errors.name && <Text size="sm" className="text-red-500 mt-1">{errors.name}</Text>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CNPJ (MEI) *</label>
                <Input
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleInputChange}
                  hasError={!!errors.cnpj}
                  placeholder="XX.XXX.XXX/0001-XX"
                  maxLength={18}
                />
                {errors.cnpj && <Text size="sm" className="text-red-500 mt-1">{errors.cnpj}</Text>}
              </div>

               <div>
                <label className="block text-sm font-medium mb-2">CEP *</label>
                <Input
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  hasError={!!errors.zipCode}
                />
                {errors.zipCode && <Text size="sm" className="text-red-500 mt-1">{errors.zipCode}</Text>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Endereço Completo *</label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Rua, número, bairro"
                  hasError={!!errors.address}
                />
                {errors.address && <Text size="sm" className="text-red-500 mt-1">{errors.address}</Text>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cidade *</label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  hasError={!!errors.city}
                />
                {errors.city && <Text size="sm" className="text-red-500 mt-1">{errors.city}</Text>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Estado *</label>
                <Input
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  hasError={!!errors.state}
                />
                {errors.state && <Text size="sm" className="text-red-500 mt-1">{errors.state}</Text>}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={formData.agreedToTerms}
                  onCheckedChange={(checked) => {
                      setFormData(prev => ({ ...prev, agreedToTerms: checked as boolean }));
                      if (errors.agreedToTerms) setErrors(prev => ({ ...prev, agreedToTerms: "" }));
                  }}
                />
                <div>
                  <Text size="sm">Declaro que li e concordo com todos os termos do contrato de prestação de serviços apresentado.</Text>
                  {errors.agreedToTerms && <Text size="sm" className="text-red-500 mt-2">{errors.agreedToTerms}</Text>}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => setIsSigningMode(false)} variant="ghost" disabled={isSubmitting}>
                Voltar
              </Button>
              <Button
                onClick={handleSignContract}
                disabled={!formData.agreedToTerms || isSubmitting}
                isLoading={isSubmitting}
                variant="success"
              >
                Assinar Digitalmente
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
