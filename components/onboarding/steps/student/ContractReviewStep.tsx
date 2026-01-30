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
import { ScrollText, PenTool, CheckCircle } from "lucide-react";
import ContratoPDF from "@/components/contract/ContratoPDF";

export const ContractReviewStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const { data: session } = useSession();
  const [showPDF, setShowPDF] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SignatureFormData>({
    cpf: "", name: session?.user?.name || "", birthDate: "",
    address: "", city: "", state: "", zipCode: "", agreedToTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSign = async () => {
    if (!formData.cpf || !formData.address || !formData.agreedToTerms) {
      toast.error("Preencha todos os campos e aceite os termos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData: formData, contractLengthMonths: data.contractLengthMonths }),
      });

      if (!res.ok) throw new Error("Erro");
      const result = await res.json();

      onDataChange({ contractSigned: true, contractData: result.contractStatus });
      toast.success("Contrato assinado!");
    } catch {
      toast.error("Erro ao assinar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se já assinado, exibe status. O botão do Modal dirá "Contrato assinado, continuar"
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
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
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
            <Input name="name" value={formData.name} onChange={handleChange} placeholder="Nome Completo" />
            <Input name="cpf" value={formData.cpf} onChange={handleChange} placeholder="CPF" />
            <Input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
            <Input name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="CEP" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input name="address" value={formData.address} onChange={handleChange} placeholder="Endereço" className="md:col-span-3" />
            <Input name="city" value={formData.city} onChange={handleChange} placeholder="Cidade" />
            <Input name="state" value={formData.state} onChange={handleChange} placeholder="Estado" />
        </div>

        <div className="flex items-start gap-3 pt-4 border-t">
          <Checkbox checked={formData.agreedToTerms} onCheckedChange={(c) => setFormData(p => ({...p, agreedToTerms: c as boolean}))} />
          <p className="text-sm text-gray-600">Li e concordo com os termos de serviço e política de cancelamento.</p>
        </div>

        <Button 
            onClick={handleSign} 
            disabled={!formData.agreedToTerms || isSubmitting} 
            isLoading={isSubmitting} 
            className="w-full"
            variant="success"
        >
            <PenTool className="w-4 h-4 mr-2" /> Assinar Digitalmente
        </Button>
      </Card>
    </div>
  );
};