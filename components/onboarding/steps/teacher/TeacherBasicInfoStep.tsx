"use client";

import React from "react";
import { TeacherOnboardingStepProps } from "../../TeacherOnboardingModal";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export const TeacherBasicInfoStep: React.FC<TeacherOnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const { setTheme } = useTheme();

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Perfil do Professor</h2>
        <p className="text-gray-500">Vamos configurar sua apresentação na plataforma.</p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Label>Nome de Exibição</Label>
          <Input
            placeholder="Como os alunos devem te chamar?"
            value={data.nickname}
            onChange={(e) => onDataChange({ nickname: e.target.value })}
            className="text-lg py-5"
            autoFocus
          />
          <p className="text-xs text-gray-500">
            Este nome aparecerá na sua agenda e perfil público.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Tema da Interface</Label>
          <div className="flex gap-2 h-10">
            <Button
              variant={data.theme === "light" ? "primary" : "outline"}
              onClick={() => { setTheme("light"); onDataChange({ theme: "light" }); }}
              className="flex-1"
              size="sm"
            >
              <Sun className="w-4 h-4 mr-2" /> Claro
            </Button>
            <Button
              variant={data.theme === "dark" ? "primary" : "outline"}
              onClick={() => { setTheme("dark"); onDataChange({ theme: "dark" }); }}
              className="flex-1"
              size="sm"
            >
              <Moon className="w-4 h-4 mr-2" /> Escuro
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};