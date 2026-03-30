"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  TrendingUp,
  Shield,
  Calculator,
  AlertTriangle,
  Coins,
} from "lucide-react";
import { WizardModal, WizardStep } from "../ui/wizard";

const rawSteps = [
  {
    id: "revenue",
    title: "1. Receita Bruta",
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    description: "É todo o dinheiro que entra na conta da empresa antes de você pagar qualquer boleto.",
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
    description: "Nem toda despesa é igual. Para pagar menos imposto, você precisa das despesas 'Ouro'.",
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
    description: "É a 'conta de padaria': o que sobra no seu bolso de verdade no fim do mês.",
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
    description: "A parte que o governo diz: 'Isso aqui é seu e o Leão não toca'.",
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
  const wizardSteps: WizardStep[] = rawSteps.map((step) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    icon: step.icon,
    headerBg: step.bg,
    iconColor: step.color,
    content: (
      <div className="space-y-4 mt-4">
        <motion.ul
          variants={containerListVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {step.details.map((detail, idx) => (
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
            {step.math}
          </code>
        </motion.div>
      </div>
    ),
  }));

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        title="Entenda o cálculo"
        onClick={() => setOpen(true)}
      >
        <HelpCircle className="w-4 h-4" />
      </Button>

      <WizardModal
        open={open}
        onOpenChange={setOpen}
        steps={wizardSteps}
      />
    </>
  );
}