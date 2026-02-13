"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Printer } from "lucide-react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

interface ReceiptViewProps {
  payment: {
    id: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
    description: string;
    studentName: string;
    studentEmail: string;
  };
}

export function ReceiptView({ payment }: ReceiptViewProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(payment.amount / 100);

  const formattedDate = payment.paymentDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div className="flex justify-between items-center no-print">
        <h1 className="text-2xl font-bold">Comprovante de Pagamento</h1>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="print:m-0 print:p-0 print:shadow-none print:w-full">
        <Card className="p-8 space-y-8 print:border-none print:shadow-none" ref={receiptRef}>
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="relative h-12 w-48 mx-auto">
              <Image
                src="/logo.png"
                alt="Fluency Lab"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Comprovante de Pagamento
            </div>
          </div>

          <Separator />

          {/* Amount */}
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">Valor Total</div>
            <div className="text-4xl font-bold text-primary">
              {formattedAmount}
            </div>
            <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium print:border print:border-green-200">
              Pago com sucesso
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Pagador</div>
              <div className="font-medium">{payment.studentName}</div>
              <div className="text-sm text-muted-foreground">{payment.studentEmail}</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Data do Pagamento</div>
              <div className="font-medium">{formattedDate}</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Método de Pagamento</div>
              <div className="font-medium uppercase">{payment.paymentMethod}</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Referência</div>
              <div className="font-medium">{payment.description}</div>
            </div>

             <div className="space-y-1">
              <div className="text-sm text-muted-foreground">ID da Transação</div>
              <div className="font-mono text-xs text-muted-foreground break-all">
                {payment.id}
              </div>
            </div>
          </div>

          <Separator />

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground space-y-2">
            <p>Fluency Lab School - CNPJ: XX.XXX.XXX/0001-XX</p>
            <p>Este documento é um comprovante válido de pagamento.</p>
          </div>
        </Card>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 20mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          /* Hide other layout elements like sidebar/header if they exist outside this component */
          nav, aside, header:not(.receipt-header), footer:not(.receipt-footer) {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
