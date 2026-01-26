"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Container } from "@/components/ui/container";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function ConvertSlotPage() {
  const params = useParams();
  const router = useRouter();
  const { classId } = params;
  const [isConverting, setIsConverting] = useState(false);
  const [isConverted, setIsConverted] = useState(false);

  const handleConvertToSlot = async () => {
    if (!classId) return;

    setIsConverting(true);
    try {
      const response = await fetch(`/api/classes/${classId}/convert-to-slot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erro ao converter aula em slot livre"
        );
      }

      toast.success("Aula convertida em slot disponível com sucesso!");
      setIsConverted(true);
    } catch (error: any) {
      console.error("Erro ao converter aula:", error);
      toast.error(error.message || "Erro ao converter aula em slot livre");
    } finally {
      setIsConverting(false);
    }
  };

  const handleGoToPlatform = () => {
    router.push("/hub/plataforma");
  };

  if (isConverted) {
    return (
      <Container className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <Text variant="title" size="xl" className="mb-2">
              Slot Criado com Sucesso!
            </Text>
            <Text className="text-subtitle mb-6">
              Sua aula foi convertida em um slot disponível. Outros alunos agora
              podem agendar este horário.
            </Text>
          </div>
          <Button onClick={handleGoToPlatform} className="w-full">
            Voltar à Plataforma
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Card className="flex flex-col items-center justify-center w-full h-full">
      <Card className="flex flex-col items-center justify-center p-8 py-18 max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-subcontainer rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <Text variant="title" size="xl" className="mb-2">
            Converter Aula em Slot Livre
          </Text>
          <Text className="text-subtitle mb-6">
            Deseja converter esta aula cancelada/reagendada em um slot
            disponível para outros alunos?
          </Text>
        </div>

        <div className="flex flex-wrap gap-2 space-y-3">
          <Button
            onClick={handleConvertToSlot}
            disabled={isConverting}
            variant="success"
          >
            {isConverting ? <Spinner /> : "Sim, Tornar Slot Livre"}
          </Button>

          <Button onClick={handleGoToPlatform} variant="destructive">
            Cancelar
          </Button>
        </div>
      </Card>
    </Card>
  );
}
