// components/onboarding/steps/BestPracticesStep.tsx
"use client";

import React, { useState } from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Card } from "@/components/ui/card";
import { Lightbulb, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

interface PracticeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tips: string[];
  color: "blue" | "green" | "purple" | "orange";
}

const PracticeCard: React.FC<PracticeCardProps> = ({
  icon,
  title,
  description,
  tips,
  color,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const colorClasses = {
    blue: {
      border: "border-blue-200 dark:border-blue-800",
      bg: "bg-blue-50/50 dark:bg-blue-900/20",
      iconBg: "bg-blue-100 dark:bg-blue-800",
      iconColor: "text-blue-600 dark:text-blue-300",
      buttonColor: "text-blue-600 hover:text-blue-700 dark:text-blue-300",
    },
    green: {
      border: "border-green-200 dark:border-green-800",
      bg: "bg-green-50/50 dark:bg-green-900/20",
      iconBg: "bg-green-100 dark:bg-green-800",
      iconColor: "text-green-600 dark:text-green-300",
      buttonColor: "text-green-600 hover:text-green-700 dark:text-green-300",
    },
    purple: {
      border: "border-purple-200 dark:border-purple-800",
      bg: "bg-purple-50/50 dark:bg-purple-900/20",
      iconBg: "bg-purple-100 dark:bg-purple-800",
      iconColor: "text-purple-600 dark:text-purple-300",
      buttonColor: "text-purple-600 hover:text-purple-700 dark:text-purple-300",
    },
    orange: {
      border: "border-orange-200 dark:border-orange-800",
      bg: "bg-orange-50/50 dark:bg-orange-900/20",
      iconBg: "bg-orange-100 dark:bg-orange-800",
      iconColor: "text-orange-600 dark:text-orange-300",
      buttonColor: "text-orange-600 hover:text-orange-700 dark:text-orange-300",
    },
  };

  const classes = colorClasses[color];

  return (
    <Card
      className={`p-6 ${classes.border} ${classes.bg} transition-all duration-200 `}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 ${classes.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}
        >
          <div className={classes.iconColor}>{icon}</div>
        </div>

        <div className="flex-1">
          <Text variant="title">{title}</Text>
          <Text className="text-gray-600 dark:text-gray-300 mb-3">
            {description}
          </Text>

          {isExpanded && (
            <div className="space-y-2 mb-3">
              {tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Link className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <Text size="sm" className="text-gray-600 dark:text-gray-300">
                    {tip}
                  </Text>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`h-auto font-medium ${classes.buttonColor}`}
          >
            {isExpanded ? "Ver menos" : "Ver dicas"}
            <Link
              className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export const BestPracticesStep: React.FC<OnboardingStepProps> = ({
  onNext,
}) => {
  const practices = [
    {
      icon: <Link className="w-6 h-6" />,
      title: "Pontualidade e Consistência",
      description:
        "A regularidade é fundamental para o aprendizado eficaz de idiomas.",
      tips: [
        "Chegue 5 minutos antes do horário marcado",
        "Mantenha uma rotina de estudos consistente",
        "Avise com antecedência caso precise reagendar",
        "Use lembretes no calendário para não esquecer",
      ],
      color: "blue" as const,
    },
    {
      icon: <Link className="w-6 h-6" />,
      title: "Preparação para as Aulas",
      description: "Vir preparado maximiza o aproveitamento de cada sessão.",
      tips: [
        "Revise o conteúdo da aula anterior",
        "Tenha material de estudo organizado",
        "Prepare dúvidas específicas para o professor",
        "Pratique entre as aulas para fixar o conteúdo",
      ],
      color: "green" as const,
    },
    {
      icon: <Link className="w-6 h-6" />,
      title: "Comunicação Efetiva",
      description:
        "Mantenha um diálogo aberto com seu professor sobre seu progresso.",
      tips: [
        "Comunique suas dificuldades e objetivos",
        "Peça feedback regular sobre seu desempenho",
        "Sugira temas de interesse para as aulas",
        "Mantenha contato entre aulas se necessário",
      ],
      color: "purple" as const,
    },
    {
      icon: <Link className="w-6 h-6" />,
      title: "Definição de Objetivos",
      description: "Metas claras aceleram seu progresso no aprendizado.",
      tips: [
        "Estabeleça objetivos de curto e longo prazo",
        "Acompanhe seu progresso regularmente",
        "Celebre pequenas conquistas",
        "Ajuste metas conforme seu desenvolvimento",
      ],
      color: "orange" as const,
    },
  ];

  const contractHighlights = [
    {
      icon: <Link className="w-5 h-5" />,
      title: "Duração Flexível",
      desc: "Escolha entre contratos de 6 ou 12 meses",
    },
    {
      icon: <Link className="w-5 h-5" />,
      title: "Reagendamento",
      desc: "Até 2 reagendamentos gratuitos por mês",
    },
    {
      icon: <Link className="w-5 h-5" />,
      title: "Acompanhamento",
      desc: "Relatórios mensais de progresso",
    },
    {
      icon: <Link className="w-5 h-5" />,
      title: "Suporte Total",
      desc: "Equipe disponível para dúvidas e suporte",
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/20 border-1 border-secondary rounded-full mb-4">
            <Lightbulb className="w-8 h-8 text-secondary" />
          </div>

          <Text variant="title">Boas Práticas para o Sucesso</Text>
          <Text
            size="lg"
            className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Algumas dicas importantes para maximizar seu aprendizado e ter a
            melhor experiência possível conosco.
          </Text>
        </div>

        {/* Best Practices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {practices.map((practice, index) => (
            <PracticeCard key={index} {...practice} />
          ))}
        </div>

        {/* Contract Summary */}
        <Card className="p-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200 dark:border-purple-700 mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-lg mb-4">
              <Link className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>

            <Text variant="title">
              Resumo do Contrato de Prestação de Serviços
            </Text>
            <Text className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Nosso contrato foi desenvolvido para proteger você e garantir a
              qualidade do ensino.
            </Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {contractHighlights.map((item, index) => (
              <div
                key={index}
                className="text-center p-4 bg-white dark:bg-purple-900/20 rounded-lg"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg mb-2">
                  <div className="text-purple-600 dark:text-purple-300">
                    {item.icon}
                  </div>
                </div>
                <Text className="font-semibold mb-1">{item.title}</Text>
                <Text size="sm" className="text-gray-600 dark:text-gray-300">
                  {item.desc}
                </Text>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-purple-900/20 rounded-lg p-6">
            <Text variant="title">Principais Pontos do Contrato:</Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Link className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <Text className="font-medium">Aulas Personalizadas</Text>
                    <Text
                      size="sm"
                      className="text-gray-600 dark:text-gray-300"
                    >
                      Conteúdo adaptado ao seu nível e objetivos
                    </Text>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Link className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <Text className="font-medium">Pagamento Mensal</Text>
                    <Text
                      size="sm"
                      className="text-gray-600 dark:text-gray-300"
                    >
                      Cobrança entre os dias 1º e 10º de cada mês
                    </Text>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Link className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <Text className="font-medium">Aulas Online</Text>
                    <Text
                      size="sm"
                      className="text-gray-600 dark:text-gray-300"
                    >
                      Toda prestação de serviço será remota e online
                    </Text>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Link className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <Text className="font-medium">Reajuste Anual</Text>
                    <Text
                      size="sm"
                      className="text-gray-600 dark:text-gray-300"
                    >
                      Uma vez por ano em julho, com aviso prévio
                    </Text>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Link className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <Text className="font-medium">Horários Flexíveis</Text>
                    <Text
                      size="sm"
                      className="text-gray-600 dark:text-gray-300"
                    >
                      Agendamento conforme disponibilidade mútua
                    </Text>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Link className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <Text className="font-medium">Suporte Completo</Text>
                    <Text
                      size="sm"
                      className="text-gray-600 dark:text-gray-300"
                    >
                      Atendimento via plataforma e WhatsApp
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
