"use client";

import React, { useState } from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { SignatureFormData } from "@/types/contract";
import { ScrollText, PenTool, CheckCircle, Search } from "lucide-react";
import ContratoPDF from "@/components/contract/ContratoPDF";
import { validateCPF, formatCPF } from "@/lib/validation/cpf";
import { Label } from "@/components/ui/label";

export const ContractReviewStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const { data: session } = useSession();
  const [showPDF, setShowPDF] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  
  // Estado local para campos que não estão no SignatureFormData mas são necessários para o User
  const [localAddress, setLocalAddress] = useState({
    number: "",
    neighborhood: "",
    complement: ""
  });

  const [formData, setFormData] = useState<SignatureFormData>({
    cpf: "", 
    name: session?.user?.name || "", 
    birthDate: "",
    phoneNumber: "",
    address: "", 
    city: "", 
    state: "", 
    zipCode: "", 
    agreedToTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "cpf") {
        setFormData(prev => ({ ...prev, cpf: formatCPF(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleZipCodeBlur = async () => {
    const cep = formData.zipCode.replace(/\D/g, "");
    if (cep.length !== 8) return;
    
    setIsLoadingCEP(true);
    try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (data.erro) {
            toast.error("CEP não encontrado");
            return;
        }
        setFormData(prev => ({
            ...prev,
            address: data.logradouro,
            city: data.localidade,
            state: data.uf,
        }));
        setLocalAddress(prev => ({
            ...prev,
            neighborhood: data.bairro
        }));
        toast.success("Endereço encontrado!");
    } catch {
        toast.error("Erro ao buscar CEP");
    } finally {
        setIsLoadingCEP(false);
    }
  };

  const handleSign = async () => {
    if (!formData.cpf || !formData.address || !formData.city || !formData.state || !formData.zipCode || !formData.birthDate || !formData.phoneNumber || !localAddress.number || !localAddress.neighborhood) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!formData.agreedToTerms) {
      toast.error("Você precisa aceitar os termos.");
      return;
    }

    if (!validateCPF(formData.cpf)) {
        toast.error("CPF inválido. Verifique os números.");
        return;
    }

    setIsSubmitting(true);
    try {
      // Monta endereço completo para o contrato (se o backend esperar string única)
      // Mas o backend vai atualizar o User, então precisamos mandar estruturado se possível.
      // O endpoint sign-contract espera SignatureFormData. Vamos mandar os extras no body também se alterarmos o endpoint.
      // Vamos alterar o endpoint para aceitar extraData.
      
      const res = await fetch("/api/onboarding/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            signatureData: formData, 
            contractLengthMonths: data.contractLengthMonths,
            // Enviando dados extras para atualização do perfil
            profileData: {
                phoneNumber: formData.phoneNumber,
                address: {
                    street: formData.address,
                    number: localAddress.number,
                    complement: localAddress.complement,
                    neighborhood: localAddress.neighborhood,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode
                },
                cpf: formData.cpf
            }
        }),
      });

      if (!res.ok) throw new Error("Erro");
      const result = await res.json();

      // Atualiza estado global
      onDataChange({ 
        contractSigned: true, 
        contractData: result.contractStatus,
        cpf: formData.cpf,
        phoneNumber: formData.phoneNumber,
        address: {
            street: formData.address,
            number: localAddress.number,
            complement: localAddress.complement,
            neighborhood: localAddress.neighborhood,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode
        }
      });
      
      toast.success("Contrato assinado com sucesso!");
    } catch {
      toast.error("Erro ao assinar contrato. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (data.contractSigned) {
    return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[40vh] text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-green-700">Contrato Assinado</h3>
            <p className="text-gray-500 mt-2">Você pode prosseguir para o pagamento.</p>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto max-h-[50vh]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">Assinatura Digital</h3>
        <Button variant="outline" size="sm" onClick={() => setShowPDF(!showPDF)}>
          <ScrollText className="w-4 h-4 mr-2" /> {showPDF ? "Ocultar" : "Ler"} Contrato
        </Button>
      </div>

      {showPDF && (
        <Card className="mb-6 h-64 overflow-y-auto p-4 bg-gray-50 text-xs border">
          <ContratoPDF 
            alunoData={{
              ...formData, 
              email: session?.user?.email || "",
              id: session?.user?.id || ""
            }} 
            contractStatus={null} 
          />
        </Card>
      )}

      <Card className="p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="Nome Completo" />
            </div>
            <div className="space-y-2">
                <Label>CPF</Label>
                <Input name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" maxLength={14} />
            </div>
            <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
            </div>
            <div className="space-y-2">
                <Label>Celular (com DDD)</Label>
                <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="(11) 99999-9999" />
            </div>
        </div>

        <div className="pt-4 border-t">
            <h4 className="font-medium mb-4 text-sm text-gray-700">Endereço</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                    <Label>CEP</Label>
                    <div className="relative">
                        <Input 
                            name="zipCode" 
                            value={formData.zipCode} 
                            onChange={handleChange} 
                            onBlur={handleZipCodeBlur}
                            placeholder="00000-000" 
                        />
                        {isLoadingCEP && <Search className="w-4 h-4 absolute right-3 top-3 animate-spin text-gray-400" />}
                    </div>
                </div>
                <div className="space-y-2 md:col-span-3">
                    <Label>Rua / Logradouro</Label>
                    <Input name="address" value={formData.address} onChange={handleChange} placeholder="Rua..." />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label>Número</Label>
                    <Input name="number" value={localAddress.number} onChange={handleLocalChange} placeholder="123" />
                </div>
                <div className="space-y-2">
                    <Label>Complemento</Label>
                    <Input name="complement" value={localAddress.complement} onChange={handleLocalChange} placeholder="Apto 101" />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label>Bairro</Label>
                    <Input name="neighborhood" value={localAddress.neighborhood} onChange={handleLocalChange} placeholder="Bairro" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input name="city" value={formData.city} onChange={handleChange} readOnly className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input name="state" value={formData.state} onChange={handleChange} readOnly className="bg-gray-50" />
                </div>
            </div>
        </div>

        <div className="flex items-start gap-3 pt-4 border-t mt-4">
          <Checkbox 
            id="terms" 
            checked={formData.agreedToTerms} 
            onCheckedChange={(c) => setFormData(p => ({...p, agreedToTerms: c as boolean}))} 
          />
          <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer select-none">
            Li e concordo com os termos de serviço e política de cancelamento. Declaro que os dados fornecidos são verdadeiros.
          </label>
        </div>

        <Button 
            onClick={handleSign} 
            disabled={!formData.agreedToTerms || isSubmitting} 
            isLoading={isSubmitting} 
            className="w-full mt-4"
            variant="success"
        >
            <PenTool className="w-4 h-4 mr-2" /> Assinar Digitalmente
        </Button>
      </Card>
    </div>
  );
};
