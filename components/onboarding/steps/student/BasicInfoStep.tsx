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
import { useTranslations } from "next-intl";
import { OnboardingStepProps } from "../../OnboardingModal";

export const BasicInfoStep: React.FC<OnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const t = useTranslations("Onboarding.Student.BasicInfo");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-lg mx-auto">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t("nicknameLabel")}</Label>
          <Input
            value={data.nickname}
            onChange={(e) => onDataChange({ nickname: e.target.value })}
            placeholder={t("nicknamePlaceholder")}
            className="h-12 text-lg"
          />
          {data.nickname.length > 0 && data.nickname.length < 2 && (
            <p className="text-xs text-red-500">{t("nicknameError")}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("languageLabel")}</Label>
            <Select
              value={data.interfaceLanguage}
              onValueChange={(val) => onDataChange({ interfaceLanguage: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("themeLabel")}</Label>
            <Select
              value={data.theme}
              onValueChange={(val: any) => onDataChange({ theme: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t("themeLight")}</SelectItem>
                <SelectItem value="dark">{t("themeDark")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-4">
          {t("note")}
        </p>
      </div>
    </div>
  );
};
