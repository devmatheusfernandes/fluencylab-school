"use client";

import React from "react";
import { OnboardingStepProps } from "../../OnboardingModal";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { languages } from "@/types/core/languages";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BasicInfoStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const { setTheme } = useTheme();

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDataChange({ nickname: e.target.value });
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    onDataChange({ theme: newTheme });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6 space-y-6">
        {/* Nickname */}
        <div className="space-y-2">
          <Label className="text-base">Como você quer ser chamado?</Label>
          <Input
            placeholder="Seu apelido ou nome curto"
            value={data.nickname}
            onChange={handleNicknameChange}
            autoFocus
          />
          {data.nickname.length > 0 && data.nickname.length < 2 && (
            <p className="text-xs text-red-500">Mínimo de 2 caracteres</p>
          )}
        </div>

        {/* Idioma e Tema na mesma linha em desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Idioma da Plataforma</Label>
            <Select
              value={data.interfaceLanguage}
              onValueChange={(v) => onDataChange({ interfaceLanguage: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tema</Label>
            <div className="flex gap-2">
              <Button
                variant={data.theme === "light" ? "primary" : "outline"}
                onClick={() => handleThemeChange("light")}
                className="flex-1"
                size="sm"
              >
                <Sun className="w-4 h-4 mr-2" /> Claro
              </Button>
              <Button
                variant={data.theme === "dark" ? "primary" : "outline"}
                onClick={() => handleThemeChange("dark")}
                className="flex-1"
                size="sm"
              >
                <Moon className="w-4 h-4 mr-2" /> Escuro
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      <p className="text-center text-xs text-gray-500 mt-4">
        Você poderá alterar tudo isso depois nas configurações.
      </p>
    </div>
  );
};