"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConvertSlotPage() {
  const params = useParams();
  const router = useRouter();
  const { classId } = params;

  // Estados
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [isConverted, setIsConverted] = useState(false);

  // Simula o carregamento dos dados da aula para exibir o Skeleton
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingDetails(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleConvertToSlot = async () => {
    if (!classId) return;

    setIsConverting(true);
    try {
      const response = await fetch(`/api/classes/${classId}/convert-to-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao converter aula.");
      }

      toast.success("Sucesso! O horário está disponível.");
      setIsConverted(true);
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error(error.message || "Não foi possível converter a aula.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleGoToPlatform = () => {
    router.push("/hub");
  };

  // Variantes de animação
  const fadeInUp = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 },
  };

  return (
    <Container className="container-padding w-full h-full flex items-center justify-center">
      <AnimatePresence mode="wait">
        {/* ESTADO 1: CARREGANDO (SKELETON) */}
        {isLoadingDetails && (
          <motion.div
            key="loading"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeInUp}
            className="w-full max-w-md"
          >
            <Card className="p-8 flex flex-col items-center text-center space-y-6 shadow-sm border-border/50">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 w-full flex flex-col items-center">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="w-full space-y-3 pt-4">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </Card>
          </motion.div>
        )}

        {/* ESTADO 2: SUCESSO */}
        {!isLoadingDetails && isConverted && (
          <motion.div
            key="success"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="w-full max-w-md"
          >
            <Card className="p-8 shadow-lg border-green-100 dark:border-green-900/30 bg-card">
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </motion.div>

                <Text variant="title" size="xl" className="font-semibold mb-2">
                  Slot Criado!
                </Text>
                <Text className="text-muted-foreground mb-8 text-sm leading-relaxed">
                  Sua aula foi convertida com sucesso. O horário agora aparece
                  como
                  <span className="font-medium text-foreground">
                    {" "}
                    disponível{" "}
                  </span>
                  para agendamento por outros alunos.
                </Text>

                <Button
                  onClick={handleGoToPlatform}
                  className="w-full gap-2"
                  size="lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar à Plataforma
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ESTADO 3: AÇÃO (CONVERTER) */}
        {!isLoadingDetails && !isConverted && (
          <motion.div
            key="action"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeInUp}
            className="w-full max-w-md"
          >
            <Card className="p-8 shadow-sm hover:shadow-md transition-shadow duration-300 border-border/60">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-primary/10">
                  <CalendarClock className="w-8 h-8 text-primary" />
                </div>

                <Text variant="title" size="xl" className="font-semibold mb-3">
                  Liberar Horário
                </Text>

                <Text className="text-muted-foreground mb-8 text-sm leading-relaxed max-w-xs mx-auto">
                  Ao confirmar, esta aula cancelada se tornará um
                  <span className="font-medium text-foreground">
                    {" "}
                    slot livre{" "}
                  </span>
                  imediatamente visível na agenda pública.
                </Text>

                <div className="w-full flex flex-col gap-3">
                  <Button
                    onClick={handleConvertToSlot}
                    disabled={isConverting}
                    size="lg"
                    className="w-full relative overflow-hidden"
                    // Nota: Se o seu tema não tiver variant="success", use className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isConverting ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processando...</span>
                      </div>
                    ) : (
                      "Sim, Liberar Horário"
                    )}
                  </Button>

                  <Button
                    onClick={handleGoToPlatform}
                    variant="ghost"
                    disabled={isConverting}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    Não, cancelar ação
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
}
