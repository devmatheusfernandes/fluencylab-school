"use client";

import { motion } from "framer-motion";
import { XCircle, CheckCircle2, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent, // Não usado diretamente, mas parte do pacote
  CardHeader, // Opcional dependendo do layout
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// --- DADOS ---
const comparisons = [
  {
    title: "Apps (Duolingo, Babbel)",
    problemTitle: "O Problema dos Apps",
    problems: [
      "Exercícios repetitivos",
      "Decorar palavras soltas",
      "Sem acompanhamento real",
      "90% desistem no caminho",
    ],
    solutionTitle: "Método Natural Fluency Lab",
    solutions: [
      "Aprenda como aprendeu português",
      "Sem decoreba forçada",
      "Tutor dedicado que te conhece",
      "Planejamento anti-desistência",
    ],
  },
  {
    title: "Marketplaces (Preply, iTalki)",
    problemTitle: "O Problema dos Marketplaces",
    problems: [
      "Cada aula é isolada",
      "Sem currículo estruturado",
      "Você que tem que gerenciar tudo",
    ],
    solutionTitle: "Currículo Personalizado",
    solutions: [
      "Plano feito 100% para você",
      "Cronograma baseado nos seus objetivos",
      "A gente gerencia seu aprendizado",
    ],
  },
  {
    title: "Escolas Tradicionais",
    problemTitle: "O Problema das Escolas Online",
    problems: [
      "Turmas com ritmo fixo",
      "Conteúdo genérico para todos",
      "Horários inflexíveis",
    ],
    solutionTitle: "Totalmente Seu",
    solutions: [
      "Ritmo adaptado a você",
      "Temas que você gosta",
      "Horários que funcionam pra você",
    ],
  },
];

// --- COMPONENTE DE CARD REUTILIZÁVEL ---
// Criamos isso para não repetir código no Mobile e no Desktop
const ComparisonCard = ({ item }: { item: (typeof comparisons)[0] }) => (
  <Card className="h-full flex flex-col overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow duration-300">
    {/* Parte Superior: O Problema */}
    <div className="bg-slate-100/50 dark:bg-slate-900/50 p-6 flex-1 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4">
        <Badge
          variant="destructive"
          className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-none"
        >
          Outros
        </Badge>
        <span className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">
          {item.title}
        </span>
      </div>
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
        {item.problemTitle}
      </h3>
      <ul className="space-y-3">
        {item.problems.map((prob, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-slate-600 dark:text-slate-400 text-sm"
          >
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{prob}</span>
          </li>
        ))}
      </ul>
    </div>

    {/* Parte Inferior: A Solução */}
    <div className="bg-white dark:bg-slate-950 p-6 flex-1 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-950 p-1 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
        <ArrowRight className="w-5 h-5 text-slate-400 rotate-90" />
      </div>

      <div className="flex items-center gap-2 mb-4 pt-2">
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-none shadow-none">
          Fluency Lab
        </Badge>
      </div>

      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
        {item.solutionTitle}
      </h3>

      <ul className="space-y-3">
        {item.solutions.map((sol, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm font-medium"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <span>{sol}</span>
          </li>
        ))}
      </ul>
    </div>
  </Card>
);

// --- COMPONENTE PRINCIPAL ---
export default function ComparisonSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950">
      <div className="container px-4 mx-auto max-w-7xl">
        {/* Cabeçalho */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16 space-y-4">
          <Badge
            variant="outline"
            className="px-4 py-1 border-primary/20 text-primary bg-primary/5"
          >
            Diferenciais
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Por que a Fluency Lab é diferente?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Você já tentou aprender com apps e desistiu. Ou fez aulas genéricas
            que não levaram a lugar nenhum. A gente sabe — e criamos algo
            totalmente diferente.
          </p>
        </div>

        {/* --- VERSÃO MOBILE (CAROUSEL) --- */}
        {/* 'block lg:hidden' faz aparecer só em telas menores que 1024px */}
        <div className="block lg:hidden px-2">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-sm mx-auto sm:max-w-md"
          >
            <CarouselContent>
              {comparisons.map((item, index) => (
                <CarouselItem key={index} className="md:basis-1/2">
                  <div className="p-1 h-full">
                    <ComparisonCard item={item} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {/* Controles de navegação (opcional, ajustei para não sobrepor em telas muito pequenas) */}
            <div className="hidden sm:block">
              <CarouselPrevious className="-left-12" />
              <CarouselNext className="-right-12" />
            </div>
            {/* Indicador visual simples para mobile touch */}
            <div className="mt-4 text-center text-sm text-slate-400 sm:hidden">
              Deslize para ver mais →
            </div>
          </Carousel>
        </div>

        {/* --- VERSÃO DESKTOP (GRID) --- */}
        {/* 'hidden lg:grid' faz aparecer só em telas maiores ou iguais a 1024px */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="hidden lg:grid grid-cols-3 gap-8"
        >
          {comparisons.map((item, index) => (
            <motion.div key={index} variants={itemVariants} className="h-full">
              <ComparisonCard item={item} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
