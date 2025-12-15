// components/onboarding/steps/FinishStep.tsx
"use client";

import React from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useSession } from "next-auth/react";
import { formatPrice } from "@/config/pricing";
import { Link } from "lucide-react";

interface NextStepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  color: "blue" | "green" | "purple" | "orange";
}

const NextStepCard: React.FC<NextStepCardProps> = ({
  icon,
  title,
  description,
  action,
  color,
}) => {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      iconBg: "bg-blue-100 dark:bg-blue-800",
      iconColor: "text-blue-600 dark:text-blue-300",
      textColor: "text-blue-900 dark:text-blue-100",
      descColor: "text-blue-700 dark:text-blue-200",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
      iconBg: "bg-green-100 dark:bg-green-800",
      iconColor: "text-green-600 dark:text-green-300",
      textColor: "text-green-900 dark:text-green-100",
      descColor: "text-green-700 dark:text-green-200",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      border: "border-purple-200 dark:border-purple-800",
      iconBg: "bg-purple-100 dark:bg-purple-800",
      iconColor: "text-purple-600 dark:text-purple-300",
      textColor: "text-purple-900 dark:text-purple-100",
      descColor: "text-purple-700 dark:text-purple-200",
    },
    orange: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-200 dark:border-orange-800",
      iconBg: "bg-orange-100 dark:bg-orange-800",
      iconColor: "text-orange-600 dark:text-orange-300",
      textColor: "text-orange-900 dark:text-orange-100",
      descColor: "text-orange-700 dark:text-orange-200",
    },
  };

  const classes = colorClasses[color];

  return (
    <Card
      className={`p-6 ${classes.bg} ${classes.border} hover:shadow-md transition-all duration-200`}
    >
      <div
        className={`w-12 h-12 ${classes.iconBg} rounded-lg flex items-center justify-center mb-4`}
      >
        <div className={classes.iconColor}>{icon}</div>
      </div>

      <Text variant="title" className={`${classes.textColor} mb-2`}>
        {title}
      </Text>
      <Text className={`${classes.descColor} mb-3`}>{description}</Text>

      <div className="flex items-center gap-2 text-sm font-medium">
        <span className={classes.textColor}>{action}</span>
        <Link className={`w-4 h-4 ${classes.iconColor}`} />
      </div>
    </Card>
  );
};

export const FinishStep: React.FC<OnboardingStepProps> = ({ data }) => {
  const { data: session } = useSession();

  const firstName =
    session?.user?.name?.split(" ")[0] || data.nickname || "Estudante";

  // Get pricing info
  const isGuardedStudent = session?.user?.role === "GUARDED_STUDENT";
  const basePrice = isGuardedStudent ? 39900 : 29900;
  const monthlyPrice =
    data.contractLengthMonths === 12 ? Math.round(basePrice * 0.85) : basePrice;

  const nextSteps = [
    {
      icon: <Link className="w-6 h-6" />,
      title: "Complete seu Perfil",
      description:
        "Adicione informações sobre seus objetivos e nível atual de conhecimento.",
      action: "Completar Perfil",
      color: "green" as const,
    },
    {
      icon: <Link className="w-6 h-6" />,
      title: "Conheça a Plataforma",
      description:
        "Explore todas as funcionalidades disponíveis no seu dashboard.",
      action: "Tour da Plataforma",
      color: "purple" as const,
    },
    {
      icon: <Link className="w-6 h-6" />,
      title: "Junte-se à Comunidade",
      description:
        "Conecte-se com outros estudantes e participe de eventos especiais.",
      action: "Ver Comunidade",
      color: "orange" as const,
    },
  ];

  const achievements = [
    {
      icon: <Link className="w-5 h-5 text-green-500" />,
      text: "Conta criada e verificada",
    },
    {
      icon: <Link className="w-5 h-5 text-green-500" />,
      text: "Preferências configuradas",
    },
    {
      icon: <Link className="w-5 h-5 text-green-500" />,
      text: "Contrato assinado digitalmente",
    },
    {
      icon: <Link className="w-5 h-5 text-green-500" />,
      text: "Pagamento configurado",
    },
    {
      icon: <Link className="w-5 h-5 text-green-500" />,
      text: "Pronto para começar!",
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Main Celebration */}
        <div className="text-center mb-6">
          <Text
            variant="title"
            size="3xl"
            className="mb-4 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Parabéns, {firstName}! 🎉
          </Text>

          <Text
            size="xl"
            className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto"
          >
            Você completou sua integração ao Fluency Lab com sucesso! Sua
            jornada de aprendizado está prestes a começar.
          </Text>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200 px-3 py-1">
              ✅ Integração Completa
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 px-3 py-1">
              🎯 Pronto para Aprender
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200 px-3 py-1">
              🚀 Vamos Começar!
            </Badge>
          </div>
        </div>

        {/* Onboarding Summary */}
        <Card className="p-8 mb-8 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 dark:from-green-900/30 dark:via-blue-900/30 dark:to-purple-900/30 border border-green-200 dark:border-green-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <Text
                variant="title"
                size="lg"
                className="mb-4 text-green-800 dark:text-green-100"
              >
                Resumo da sua Configuração
              </Text>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Text className="text-gray-600 dark:text-gray-300">
                    Apelido:
                  </Text>
                  <Text className="font-medium">{data.nickname}</Text>
                </div>
                <div className="flex justify-between">
                  <Text className="text-gray-600 dark:text-gray-300">
                    Idioma:
                  </Text>
                  <Text className="font-medium">
                    {data.interfaceLanguage === "pt" ? "Português" : "English"}
                  </Text>
                </div>
                <div className="flex justify-between">
                  <Text className="text-gray-600 dark:text-gray-300">
                    Tema:
                  </Text>
                  <Text className="font-medium capitalize">{data.theme}</Text>
                </div>
                <div className="flex justify-between">
                  <Text className="text-gray-600 dark:text-gray-300">
                    Contrato:
                  </Text>
                  <Text className="font-medium">
                    {data.contractLengthMonths} meses
                  </Text>
                </div>
                <div className="flex justify-between">
                  <Text className="text-gray-600 dark:text-gray-300">
                    Pagamento:
                  </Text>
                  <Text className="font-medium">
                    {data.paymentMethod === "pix" ? "PIX" : "Cartão de Crédito"}
                  </Text>
                </div>
                <div className="flex justify-between">
                  <Text className="text-gray-600 dark:text-gray-300">
                    Mensalidade:
                  </Text>
                  <Text className="font-bold text-green-600">
                    {formatPrice(monthlyPrice)}
                  </Text>
                </div>
              </div>
            </div>

            <div>
              <Text
                variant="title"
                size="lg"
                className="mb-4 text-blue-800 dark:text-blue-100"
              >
                Progresso da Integração
              </Text>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {achievement.icon}
                    <Text className="text-gray-700 dark:text-gray-200">
                      {achievement.text}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <div className="mb-8">
          <Text variant="title" size="xl" className="text-center mb-6">
            Próximos Passos
          </Text>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nextSteps.map((step, index) => (
              <NextStepCard key={index} {...step} />
            ))}
          </div>
        </div>

        {/* Success Message */}
        <Card className="p-6 bg-gradient-to-r from-success to-primary text-white text-center">
          <Text size="xl" className="mb-3 text-white">
            Bem-vindo à Fluency Lab! 💙
          </Text>
          <Text className="mb-4 text-green-50">
            Estamos muito empolgados em fazer parte da sua jornada de
            aprendizado. Nossa equipe está pronta para ajudá-lo a alcançar a
            fluência dos seus sonhos!
          </Text>

          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <span className="bg-white/20 px-3 py-1 rounded-full">
              Aprenda no seu ritmo
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              Foque nos seus objetivos
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              Alcance a fluência
            </span>
          </div>
        </Card>

        {/* Contact Info */}
        <div className="text-center mt-8">
          <Text size="sm" className="text-gray-500 dark:text-gray-400 mb-2">
            Precisa de ajuda? Nossa equipe está sempre disponível!
          </Text>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="text-blue-600 dark:text-blue-400">
              📧 contato@fluencylab.me
            </span>
            <span className="text-green-600 dark:text-green-400">
              📱 WhatsApp: (86) 99999-9999
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
