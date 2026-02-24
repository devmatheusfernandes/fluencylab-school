"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, Info } from "lucide-react";
import { generateReceiptPDF } from "@/lib/utils/pdfGenerator";

interface ReceiptViewProps {
  payment: {
    id: string;
    amount: number;
    paymentDate: Date | string;
    paymentMethod: string;
    description: string;
    studentName: string;
    studentEmail: string;
    guardianName: string;
    birthDate: string;
    payerDocument?: string;
    receiverDocument?: string;
  };
}

export function ReceiptView({ payment }: ReceiptViewProps) {
  const [isGeneratingProcess, setIsGeneratingProcess] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingProcess(true);
      const success = generateReceiptPDF(payment);
      if (!success) {
        alert("Houve um erro ao gerar o PDF. Verifique o console.");
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Houve um erro ao gerar o PDF. Verifique o console.");
    } finally {
      setIsGeneratingProcess(false);
    }
  };

  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(payment.amount / 100);

  const dateObj = new Date(payment.paymentDate);
  const formattedDate = dateObj.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const fullDateTime = `${formattedDate} às ${formattedTime}`;

  const calculateIsMinor = (birthDateString: string) => {
    if (!birthDateString) return false;
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 18;
  };

  const isMinor = calculateIsMinor(payment.birthDate);
  const payerName = !isMinor ? payment.studentName : payment.guardianName;

  const displayPayerDoc = payment.payerDocument || "706.***.811-**";
  const displayReceiverDoc = payment.receiverDocument || "XX.XXX.XXX/0001-XX";

  return (
    <div className="flex flex-col items-center py-2 px-4 space-y-6 min-h-screen">
      {/* Wrapper Visual */}
      <div className="w-full max-w-md bg-background rounded-xl overflow-hidden">
        {/* Container do Recibo (Alvo do Print) */}
        <div
          id="receipt-content"
          className="bg-background flex flex-col font-sans relative"
        >
          {/* Header Verde */}
          <div className="bg-[#a3e635] p-8 relative overflow-hidden h-40 flex items-center">
            {/* SVG Flask como Marca d'água no fundo */}
            <div className="absolute -right-6 -bottom-8 w-48 h-48 text-[#84cc16] opacity-40 -rotate-12 pointer-events-none">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Borda superior / Tampa */}
                <rect x="35" y="10" width="30" height="6" rx="2" />
                {/* Gargalo e Corpo */}
                <path d="M40 16 v20 l-25 45 a8 8 0 0 0 7 12 h56 a8 8 0 0 0 7 -12 l-25 -45 v-20 z" />

                {/* Detalhes Vazados (Usando a cor do fundo #a3e635 para simular transparência) */}
                {/* Linha do nível do líquido */}
                <path
                  d="M26 50 h48"
                  stroke="#a3e635"
                  strokeWidth="4"
                  fill="none"
                />
                {/* Bolhas */}
                <circle cx="38" cy="75" r="6" fill="#a3e635" />
                <circle cx="55" cy="65" r="3" fill="#a3e635" />
                <circle cx="62" cy="80" r="4.5" fill="#a3e635" />
                <circle cx="48" cy="85" r="2" fill="#a3e635" />
              </svg>
            </div>

            <div className="relative z-10 space-y-4">
              <FileText className="h-6 w-6 text-[#14532d]" />
              <h1 className="text-2xl font-semibold text-[#14532d] leading-tight m-0 p-0">
                Comprovante de <br /> transferência.
              </h1>
            </div>
          </div>

          {/* Corpo do Recibo */}
          <div className="p-8 flex flex-col gap-6 text-text bg-background">
            <div className="space-y-3">
              <h2 className="text-[15px] font-medium text-text m-0">
                Dados do Pagador
              </h2>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Nome</span>
                <span className="font-medium text-right">{payerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">CPF/CNPJ</span>
                <span className="font-medium text-right">
                  {displayPayerDoc}
                </span>
              </div>
            </div>

            <div className="w-full h-px bg-foreground"></div>

            <div className="space-y-3">
              <h2 className="text-[15px] font-medium text-text m-0">
                Dados do recebedor
              </h2>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Nome</span>
                <span className="font-medium text-right max-w-[200px]">
                  Fluency Lab School
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">CPF/CNPJ</span>
                <span className="font-medium text-right">
                  {displayReceiverDoc}
                </span>
              </div>
            </div>

            <div className="w-full h-px bg-foreground"></div>

            <div className="space-y-3">
              <h2 className="text-[15px] font-medium text-text m-0">
                Descrição
              </h2>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Forma de pagamento</span>
                <span className="font-medium text-right uppercase">
                  {payment.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Data de vencimento</span>
                <span className="font-medium text-right">{fullDateTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Data de pagamento</span>
                <span className="font-medium text-right">{fullDateTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">ID Transação</span>
                <span className="font-medium text-right text-xs truncate ml-4">
                  {payment.id}
                </span>
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 mt-2 flex items-start gap-3">
              <Info className="h-4 w-4 text-[#4b5563] shrink-0 mt-0.5" />
              <p className="text-xs text-[#4b5563] leading-relaxed m-0">
                Este documento e cobrança não possuem valor fiscal e são de
                responsabilidade única e exclusiva de{" "}
                <span className="font-semibold text-text">
                  Fluency Lab School
                </span>
              </p>
            </div>
          </div>

          {/* Footer com Valor */}
          <div className="bg-background p-8 pt-0 flex justify-between items-center mt-auto">
            <span className="text-sm font-semibold text-text">VALOR PAGO</span>
            <span className="text-xl font-semibold text-text">
              {formattedAmount}
            </span>
          </div>
        </div>
      </div>

      <Button
        onClick={handleDownloadPDF}
        disabled={isGeneratingProcess}
        variant="outline"
        className="gap-2 bg-white"
      >
        {isGeneratingProcess ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isGeneratingProcess ? "Gerando PDF..." : "Baixar Comprovante"}
      </Button>
    </div>
  );
}
