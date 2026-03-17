"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalPrimaryButton,
  ModalSecondaryButton,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Shield,
  Calculator,
  AlertTriangle,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: "revenue",
    title: "1. Receita Bruta",
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    description:
      "É todo o dinheiro que entra na conta da empresa antes de você pagar qualquer boleto.",
    details: [
      "Vem das mensalidades dos seus alunos.",
      "Exemplo: 100 alunos x R$ 100,00 = R$ 10.000,00.",
      "Não desconte nada ainda, é o valor cheio.",
    ],
    math: "Receita = Soma das Vendas/Mensalidades",
  },
  {
    id: "expenses",
    title: "2. Despesas (Ouro vs Pedra)",
    icon: Coins,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    description:
      "Nem toda despesa é igual. Para pagar menos imposto, você precisa das despesas 'Ouro'.",
    details: [
      "🟡 Dedutíveis (Ouro): Essenciais com Nota no CNPJ (Internet, IA, Site, DAS).",
      "🪨 Indedutíveis (Pedra): Aluguel de casa e Luz (uso misto).",
    ],
    math: "Dedutíveis = Gastos c/ Nota no CNPJ",
  },
  {
    id: "accounting",
    title: "3. Lucro Contábil (Real)",
    icon: Calculator,
    color: "text-slate-600",
    bg: "bg-slate-100 dark:bg-slate-800/50",
    description:
      "É a 'conta de padaria': o que sobra no seu bolso de verdade no fim do mês.",
    details: [
      "Aqui entra tudo: Receita menos TODAS as despesas.",
      "É o dinheiro real que você tem disponível para gastar.",
    ],
    math: "Contábil = Receita - Tudo que saiu",
  },
  {
    id: "exempt",
    title: "4. Parcela Isenta (Benefício)",
    icon: Shield,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    description:
      "A parte que o governo diz: 'Isso aqui é seu e o Leão não toca'.",
    details: [
      "Para serviços, a isenção é de 32% da Receita Bruta.",
      "Exemplo: De R$ 10 mil, R$ 3.200 são sagrados.",
    ],
    math: "Isenção = Receita Bruta x 0,32",
  },
  {
    id: "taxable",
    title: "5. Lucro Tributável (O Perigo 🚨)",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-900/20",
    description: "O valor final que conta para o seu Imposto de Renda anual.",
    details: [
      "Se a soma anual disso passar de ~R$ 30k, você paga imposto.",
      "Quanto mais despesas 'Ouro', menor fica esse valor.",
    ],
    math: "Tributável = Receita - Dedutíveis - Isenção",
  },
];

// Variantes de animação
const contentVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 20 : -20,
    opacity: 0,
    filter: "blur(4px)",
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 20 : -20,
    opacity: 0,
    filter: "blur(4px)",
    position: "absolute",
    width: "100%",
  }),
};

const containerListVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemListVariants = {
  hidden: { opacity: 0, y: 5 },
  show: { opacity: 1, y: 0 },
};

export function FiscalHelpModal() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      setOpen(false);
      setTimeout(() => {
        setCurrentStep(0);
        setDirection(0);
      }, 300);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const stepData = steps[currentStep];
  const Icon = stepData.icon;

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button variant="outline" size="icon" title="Entenda o cálculo">
          <HelpCircle className="w-4 h-4" />
        </Button>
      </ModalTrigger>

      <ModalContent className="p-0 overflow-hidden sm:max-w-[500px]">
        <div
          className={cn(
            "h-32 w-full flex items-center justify-center relative transition-colors duration-500 ease-in-out rounded-md",
            stepData.bg
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "p-4 rounded-full bg-white dark:bg-background shadow-sm",
                stepData.color
              )}
            >
              <Icon className="w-10 h-10" />
            </motion.div>
          </AnimatePresence>
        </div>

        <ModalBody className="px-6 pt-4 pb-2 relative min-h-[320px]">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={contentVariants as any}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="space-y-4"
            >
              <div className="text-center space-y-2">
                <ModalTitle className="text-xl">{stepData.title}</ModalTitle>
                <ModalDescription className="text-base mx-auto max-w-sm">
                  {stepData.description}
                </ModalDescription>
              </div>

              <div className="space-y-4 mt-4">
                <motion.ul
                  variants={containerListVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  {stepData.details.map((detail, idx) => (
                    <motion.li
                      key={idx}
                      variants={itemListVariants}
                      className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-primary/60" />
                      <span>{detail}</span>
                    </motion.li>
                  ))}
                </motion.ul>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50"
                >
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                    A Fórmula
                  </p>
                  <code className="text-sm font-mono font-semibold text-primary block break-words">
                    {stepData.math}
                  </code>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </ModalBody>

        <ModalFooter className="px-6 pb-6 pt-2 z-10 relative">
          <div className="flex w-full items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 ease-out",
                    idx === currentStep
                      ? "bg-primary w-6"
                      : "bg-gray-200 dark:bg-gray-700 w-1.5"
                  )}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <ModalSecondaryButton
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="px-4 py-2 text-sm h-10"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </ModalSecondaryButton>

              <ModalPrimaryButton
                onClick={handleNext}
                className="px-4 py-2 text-sm h-10 bg-primary text-white hover:bg-primary/90"
              >
                {currentStep === steps.length - 1 ? "Entendi" : "Próximo"}
                {currentStep !== steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 ml-1" />
                )}
              </ModalPrimaryButton>
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
