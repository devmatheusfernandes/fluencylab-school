// components/onboarding/steps/teacher/TeacherBasicInfoStep.tsx
"use client";

import React from "react";
import { TeacherOnboardingStepProps } from "../../TeacherOnboardingModal";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { useSession } from "next-auth/react";
import { Link, Moon, Speaker, Sun, User, GraduationCap } from "lucide-react";
import { useTheme } from "next-themes";

export const TeacherBasicInfoStep: React.FC<TeacherOnboardingStepProps> = ({
  data,
  onDataChange,
  onNext,
  isLoading,
}) => {
  const { data: session } = useSession();
  const { setTheme } = useTheme();
  const firstName = session?.user?.name?.split(" ")[0] || "Professor";

  const handleThemeChange = (newTheme: "light" | "dark") => {
 
    onDataChange({ theme: newTheme });
  };

  return (
    <div className="flex-1 px-8 py-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👨‍🏫</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Vamos personalizar seu perfil, {firstName}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Configure suas preferências básicas para uma experiência personalizada na plataforma.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informações Pessoais */}
          <Card className="p-6 card-base">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Informações Pessoais
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <Text className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Como você gostaria de ser chamado?
                </Text>
                <Input
                  type="text"
                  placeholder="Ex: Professor João, João Silva..."
                  value={data.nickname}
                  onChange={(e) => onDataChange({ nickname: e.target.value })}
                  className="w-full"
                />
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Este nome aparecerá para seus alunos e na plataforma
                </Text>
              </div>

              <div>
                <Text className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email (confirmado)
                </Text>
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <Text className="text-green-800 dark:text-green-200 font-medium">
                    {session?.user?.email}
                  </Text>
                </div>
              </div>
            </div>
          </Card>

          {/* Preferências da Plataforma */}
          <Card className="p-6 card-base">
            <div className="flex items-center gap-3 mb-6">
              <Speaker className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Preferências da Plataforma
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <Text className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Idioma da Interface
                </Text>
                <Select
                  value={data.interfaceLanguage}
                  onValueChange={(value) => onDataChange({ interfaceLanguage: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt">🇧🇷 Português (Brasil)</SelectItem>
                    <SelectItem value="en">🇺🇸 English (US)</SelectItem>
                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Text className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Tema da Interface
                </Text>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={data.theme === "light" ? "primary" : "outline"}
                    onClick={() => handleThemeChange("light")}
                    className="flex items-center gap-2 p-3 h-auto"
                  >
                    <Sun className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Claro</div>
                      <div className="text-xs opacity-70">Tema padrão</div>
                    </div>
                  </Button>
                  <Button
                    variant={data.theme === "dark" ? "primary" : "outline"}
                    onClick={() => handleThemeChange("dark")}
                    className="flex items-center gap-2 p-3 h-auto"
                  >
                    <Moon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Escuro</div>
                      <div className="text-xs opacity-70">Reduz cansaço visual</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Dicas para Professores */}
        <Card className="p-6 card-base mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Dica para Professores
              </h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                Escolha um nome que seja profissional mas acessível. Seus alunos se sentirão mais 
                confortáveis quando souberem como se dirigir a você. Você poderá alterar essas 
                configurações a qualquer momento nas configurações do seu perfil.
              </p>
            </div>
          </div>
        </Card>

        {/* Botão de Continuar */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={onNext}
            disabled={!data.nickname.trim() || isLoading}
            className="flex items-center gap-2 px-8 py-3"
          >
            Salvar e continuar
            <Link className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
