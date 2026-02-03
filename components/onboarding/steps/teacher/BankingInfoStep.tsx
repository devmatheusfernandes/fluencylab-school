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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  TeacherOnboardingData,
  TeacherOnboardingStepProps,
} from "../../TeacherOnboardingModal";
import { useTranslations } from "next-intl";

export const BankingInfoStep: React.FC<TeacherOnboardingStepProps> = ({
  data,
  onDataChange,
}) => {
  const t = useTranslations("Onboarding.Teacher.Banking");
  const bankingInfo = data.bankingInfo;

  const updateBankingInfo = (updates: Partial<typeof bankingInfo>) => {
    onDataChange({
      bankingInfo: { ...bankingInfo, ...updates },
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold">{t("title")}</h3>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="space-y-4">
        {/* Dados Pessoais Básicos para Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("cpf")}</Label>
            <Input
              value={bankingInfo.cpf}
              onChange={(e) => updateBankingInfo({ cpf: e.target.value })}
              placeholder="000.000.000-00"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("fullName")}</Label>
            <Input
              value={bankingInfo.fullName}
              onChange={(e) => updateBankingInfo({ fullName: e.target.value })}
              placeholder={t("fullNamePlaceholder")}
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Label>{t("methodLabel")}</Label>
          <RadioGroup
            value={bankingInfo.paymentMethod}
            onValueChange={(val: "account" | "pix") =>
              updateBankingInfo({ paymentMethod: val })
            }
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem
                value="account"
                id="account"
                className="peer sr-only"
              />
              <Label
                htmlFor="account"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                {t("methodAccount")}
              </Label>
            </div>
            <div>
              <RadioGroupItem value="pix" id="pix" className="peer sr-only" />
              <Label
                htmlFor="pix"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                {t("methodPix")}
              </Label>
            </div>
          </RadioGroup>
        </div>

        {bankingInfo.paymentMethod === "pix" ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2">
              <Label>{t("pixTypeLabel")}</Label>
              <Select
                value={bankingInfo.pixKeyType}
                onValueChange={(val: any) =>
                  updateBankingInfo({ pixKeyType: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("pixTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="random">{t("pixRandomKey")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("pixKeyLabel")}</Label>
              <Input
                value={bankingInfo.pixKey}
                onChange={(e) => updateBankingInfo({ pixKey: e.target.value })}
                placeholder={t("pixKeyPlaceholder")}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2">
              <Label>{t("bankLabel")}</Label>
              <Select
                value={bankingInfo.bankCode}
                onValueChange={(val) => updateBankingInfo({ bankCode: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("bankPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="001">Banco do Brasil</SelectItem>
                  <SelectItem value="237">Bradesco</SelectItem>
                  <SelectItem value="341">Itaú</SelectItem>
                  <SelectItem value="033">Santander</SelectItem>
                  <SelectItem value="260">Nubank</SelectItem>
                  <SelectItem value="077">Inter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("accountTypeLabel")}</Label>
              <RadioGroup
                value={bankingInfo.accountType}
                onValueChange={(val: any) =>
                  updateBankingInfo({ accountType: val })
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="checking" id="checking" />
                  <Label htmlFor="checking">{t("accountChecking")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="savings" id="savings" />
                  <Label htmlFor="savings">{t("accountSavings")}</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("agency")}</Label>
                <Input
                  value={bankingInfo.agency}
                  onChange={(e) =>
                    updateBankingInfo({ agency: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("accountNumber")}</Label>
                <Input
                  value={bankingInfo.accountNumber}
                  onChange={(e) =>
                    updateBankingInfo({ accountNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("accountDigit")}</Label>
                <Input
                  className="w-16"
                  maxLength={2}
                  value={bankingInfo.accountDigit}
                  onChange={(e) =>
                    updateBankingInfo({ accountDigit: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
