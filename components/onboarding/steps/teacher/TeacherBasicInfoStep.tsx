import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeacherOnboardingStepProps } from "../../TeacherOnboardingModal";
import { useTranslations } from "next-intl";

export const TeacherBasicInfoStep: React.FC<TeacherOnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const t = useTranslations("Onboarding.Teacher.Profile");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold">{t("title")}</h3>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t("displayNameLabel")}</Label>
          <Input
            value={data.nickname}
            onChange={(e) => onDataChange({ nickname: e.target.value })}
            placeholder={t("displayNamePlaceholder")}
            className="h-12 text-lg"
          />
          <p className="text-xs text-muted-foreground">
            {t("displayNameHelp")}
          </p>
        </div>

        <div className="space-y-2">
          <Label>{t("themeLabel")}</Label>
          <Select
            value={data.theme}
            onValueChange={(val: any) => onDataChange({ theme: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Escuro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
