// components/onboarding/steps/BasicInfoStep.tsx
"use client";

import React from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
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
import { Link, Speaker, User, Sun, Moon, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { languages } from "@/types/languages";

export const BasicInfoStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const { setTheme } = useTheme();
  const themeColors = [
    { value: "violet", label: "Violeta", color: "bg-purple-500" },
    { value: "rose", label: "Rosa", color: "bg-rose-500" },
    { value: "orange", label: "Laranja", color: "bg-orange-500" },
    { value: "yellow", label: "Amarelo", color: "bg-yellow-500" },
    { value: "green", label: "Verde", color: "bg-green-500" },
  ];

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDataChange({ nickname: e.target.value });
  };

  const handleLanguageChange = (value: string) => {
    onDataChange({ interfaceLanguage: value });
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    onDataChange({ theme: newTheme });
  };

  const applyThemeColorClass = (color: string) => {
    const root = document.documentElement;
    root.classList.remove(
      "theme-violet",
      "theme-rose",
      "theme-orange",
      "theme-yellow",
      "theme-green"
    );
    root.classList.add(`theme-${color}`);
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>

          <Text variant="title">Vamos personalizar sua experiência</Text>
          <Text size="lg" className="text-gray-600 dark:text-gray-300">
            Essas informações nos ajudarão a criar uma experiência mais
            personalizada para você.
          </Text>
        </div>

        {/* Form Section */}
        <div className="space-y-8">
          {/* Nickname Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                <Speaker className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <Text variant="title">Como gostaria de ser chamado?</Text>
                <Text size="sm" className="text-gray-600 dark:text-gray-300">
                  Escolha um apelido ou use seu nome completo
                </Text>
              </div>
            </div>

            <Input
              placeholder="Digite seu apelido preferido..."
              value={data.nickname}
              onChange={handleNicknameChange}
              className="text-lg"
            />

            {data.nickname.trim().length > 0 &&
              data.nickname.trim().length < 2 && (
                <Text size="sm" className="text-red-500 mt-2">
                  O apelido deve ter pelo menos 2 caracteres
                </Text>
              )}

            {data.nickname.trim().length >= 2 && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <Text size="sm" className="text-green-700 dark:text-green-300">
                  ✓ Perfeito! Vamos chamá-lo de <strong>{data.nickname}</strong>
                </Text>
              </div>
            )}
          </Card>

          {/* Language Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                <Link className="w-5 h-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <Text variant="title">Idioma da interface</Text>
                <Text size="sm" className="text-gray-600 dark:text-gray-300">
                  Em que idioma você prefere navegar pela plataforma?
                </Text>
              </div>
            </div>

            <Select
              value={data.interfaceLanguage}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o idioma" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Theme Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <Text variant="title">Aparência</Text>
                <Text size="sm" className="text-gray-600 dark:text-gray-300">
                  Escolha o tema e a cor que mais combinam com você
                </Text>
              </div>
            </div>

            <div className="space-y-6">
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

              <div>
                <Text size="sm" className="mb-3">
                  Cor do tema
                </Text>
                <Select
                  value={data.themeColor || "violet"}
                  onValueChange={(v) => {
                    applyThemeColorClass(v);
                    onDataChange({
                      themeColor: v as
                        | "violet"
                        | "rose"
                        | "orange"
                        | "yellow"
                        | "green",
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {themeColors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color.color}`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Help Text */}
          <div className="text-center bg-secondary/15 p-3 rounded-xl">
            <Text size="sm" className="text-gray-800 dark:text-gray-200">
              💡 Não se preocupe, você pode alterar essas configurações a
              qualquer momento nas preferências da conta.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};
