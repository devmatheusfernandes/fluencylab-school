// components/onboarding/steps/PlatformOverviewStep.tsx
"use client";

import React, { useState } from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlights: string[];
  color: "blue" | "green" | "purple" | "orange";
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  highlights,
  color,
}) => {
  const colorClasses = {
    blue: {
      border: "border-blue-200 dark:border-blue-800",
      bg: "bg-blue-50/50 dark:bg-blue-900/20",
      iconBg: "bg-blue-100 dark:bg-blue-800",
      iconColor: "text-blue-600 dark:text-blue-300",
      badgeColor:
        "bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-800 hover:dark:bg-blue-900 dark:text-blue-200",
    },
    green: {
      border: "border-green-200 dark:border-green-800",
      bg: "bg-green-50/50 dark:bg-green-900/20",
      iconBg: "bg-green-100 dark:bg-green-800",
      iconColor: "text-green-600 dark:text-green-300",
      badgeColor:
        "bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-800 hover:dark:bg-green-900 dark:text-green-200",
    },
    purple: {
      border: "border-purple-200 dark:border-purple-800",
      bg: "bg-purple-50/50 dark:bg-purple-900/20",
      iconBg: "bg-purple-100 dark:bg-purple-800",
      iconColor: "text-purple-600 dark:text-purple-300",
      badgeColor:
        "bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-800 hover:dark:bg-purple-900 dark:text-purple-200",
    },
    orange: {
      border: "border-orange-200 dark:border-orange-800",
      bg: "bg-orange-50/50 dark:bg-orange-900/20",
      iconBg: "bg-orange-100 dark:bg-orange-800",
      iconColor: "text-orange-600 dark:text-orange-300",
      badgeColor:
        "bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-800 hover:dark:bg-orange-900 dark:text-orange-200",
    },
  };

  const classes = colorClasses[color];

  return (
    <Card
      className={`p-6 ${classes.border} ${classes.bg} card-base transition-all duration-200 hover:shadow-sm hover:scale-101`}
    >
      <div
        className={`inline-flex items-center justify-center w-12 h-12 ${classes.iconBg} rounded-lg mb-4`}
      >
        <div className={classes.iconColor}>{icon}</div>
      </div>

      <Text size="lg" className="mb-3">
        {title}
      </Text>
      <Text className="text-gray-600 dark:text-gray-300 mb-4">
        {description}
      </Text>

      <div className="space-y-2">
        {highlights.map((highlight, index) => (
          <Badge
            key={index}
            className={`${classes.badgeColor} text-xs px-2 py-1 mr-2 mb-1`}
          >
            {highlight}
          </Badge>
        ))}
      </div>
    </Card>
  );
};

export const PlatformOverviewStep: React.FC<OnboardingStepProps> = ({
  onNext,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const features = [
    {
      icon: <Link className="w-6 h-6" />,
      title: "Agendamento Inteligente",
      description:
        "Agende suas aulas de forma fácil e flexível, de acordo com sua disponibilidade e preferências.",
      highlights: [
        "Horários flexíveis",
        "Reagendamento fácil",
        "Lembretes automáticos",
      ],
      color: "blue" as const,
    },
    {
      icon: <Link className="w-6 h-6" />,
      title: "Aulas Online ao Vivo",
      description:
        "Tenha aulas personalizadas com professores qualificados através de videoconferência.",
      highlights: [
        "1 a 1 com professor",
        "Material incluído",
        "Gravação das aulas",
      ],
      color: "green" as const,
    },
    {
      icon: <Link className="w-6 h-6" />,
      title: "Acompanhe seu Progresso",
      description:
        "Visualize seu desenvolvimento através de relatórios detalhados e métricas de aprendizado.",
      highlights: [
        "Relatórios detalhados",
        "Metas personalizadas",
        "Certificados",
      ],
      color: "purple" as const,
    },
    {
      icon: <Link className="w-6 h-6" />,
      title: "Pagamentos Flexíveis",
      description:
        "Escolha entre planos mensais com PIX ou cartão de crédito, com total transparência.",
      highlights: ["PIX ou Cartão", "Sem surpresas", "Cancelamento fácil"],
      color: "orange" as const,
    },
  ];

  const handleVideoToggle = () => {
    setIsPlaying(!isPlaying);
    // Here you would integrate with actual video player
  };

  return (
    <div className="py-2">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Text size="2xl" className="mb-4">
            Conheça a Plataforma Fluency Lab
          </Text>
          <Text
            size="lg"
            className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Uma experiência completa de aprendizado de idiomas, projetada para
            maximizar seus resultados com total flexibilidade e acompanhamento
            personalizado.
          </Text>
        </div>

        {/* Demo Video Section */}
        <Card className="p-6 mb-8 card-base">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <Text variant="title">Veja como funciona na prática</Text>
              <Text className="text-gray-600 dark:text-gray-300 mb-4">
                Assista a este vídeo rápido para entender como você vai usar a
                plataforma no seu dia a dia de estudos.
              </Text>
              <Button
                onClick={handleVideoToggle}
                className="flex items-center gap-2"
              >
                {isPlaying ? (
                  <Link className="w-4 h-4" />
                ) : (
                  <Link className="w-4 h-4" />
                )}
                {isPlaying ? "Pausar" : "Assistir"} demonstração (2 min)
              </Button>
            </div>

            <div className="w-full md:w-80 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              {isPlaying ? (
                <div className="text-center">
                  <div className="animate-pulse">
                    <Link className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <Text size="sm" className="text-gray-500">
                      Reproduzindo...
                    </Text>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleVideoToggle}
                  className="flex flex-col items-center gap-2 h-full w-full"
                >
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                    <Link className="w-8 h-8 text-white ml-1" />
                  </div>
                  <Text size="sm" className="text-gray-600">
                    Clique para assistir
                  </Text>
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </div>
  );
};
