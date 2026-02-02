"use client";

import { useState } from "react";
import { useAdmin } from "@/hooks/admin/useAdmin";
import { useCan } from "@/hooks/auth/useCurrentUser";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FullUserDetails } from "@/types/users/userDetails";
import { UserRoles } from "@/types/users/userRoles";
import { useTranslations, useFormatter } from "next-intl";
import { Spinner } from "../ui/spinner";

interface UserOverviewTabProps {
  user: FullUserDetails;
}

export default function UserOverviewTab({ user }: UserOverviewTabProps) {
  const t = useTranslations("UserDetails.overview");
  const tRoles = useTranslations("UserRoles");
  const tLangs = useTranslations("UserDetails.schedule.languages");
  const format = useFormatter();
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);

  // Fallback to ContratosAssinados if contractStartDate is missing
  const signedAt = (user as any).ContratosAssinados?.signedAt;
  const initialStartDate = user.contractStartDate
    ? new Date(user.contractStartDate).toISOString().split("T")[0]
    : signedAt
      ? new Date(signedAt).toISOString().split("T")[0]
      : "";

  const [contractStartDate, setContractStartDate] = useState(initialStartDate);
  const [contractLengthMonths, setContractLengthMonths] = useState(
    user.contractLengthMonths || (signedAt ? 6 : ""),
  );
  const [ratePerClassReais, setRatePerClassReais] = useState<
    number | undefined
  >(user.ratePerClassCents != null ? user.ratePerClassCents / 100 : undefined);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    user.languages || [],
  );

  const { updateUser, isLoading } = useAdmin();
  const canEditUser = useCan("user.update");

  const handleSaveChanges = async () => {
    const success = await updateUser(user.id, {
      name,
      role,
      contractStartDate: contractStartDate
        ? new Date(contractStartDate)
        : undefined,
      contractLengthMonths: Number(contractLengthMonths) as 6 | 12 | undefined,
      ratePerClassCents:
        ratePerClassReais == null
          ? undefined
          : Math.round(ratePerClassReais * 100),
      languages: selectedLanguages,
    });
    if (success) {
      toast.success(t("toasts.success"));
    } else {
      toast.error(t("toasts.error"));
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            {t("fullName")}
          </label>
          <Input
            className="capitalize"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEditUser || isLoading}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            {t("email")}
          </label>
          <Input id="email" value={user.email} disabled />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-1">
            {t("role")}
          </label>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as UserRoles)}
            disabled={!canEditUser || isLoading}
          >
            <SelectTrigger className="capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(UserRoles).map((roleValue) => (
                <SelectItem
                  className="capitalize"
                  key={roleValue}
                  value={roleValue}
                >
                  {tRoles(roleValue)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("createdAt")}
          </label>
          <Input
            value={format.dateTime(new Date(user.createdAt), {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
            disabled
          />
        </div>
        <div>
          <label
            htmlFor="contractStartDate"
            className="block text-sm font-medium mb-1"
          >
            {t("contractStartDate")}
          </label>
          <Input
            id="contractStartDate"
            type="date"
            value={contractStartDate}
            onChange={(e) => setContractStartDate(e.target.value)}
            disabled={!canEditUser || isLoading}
          />
        </div>
        <div>
          <label
            htmlFor="contractLength"
            className="block text-sm font-medium mb-1"
          >
            {t("contractLength")}
          </label>
          <Select
            value={String(contractLengthMonths)}
            onValueChange={(value) => setContractLengthMonths(value)}
            disabled={!canEditUser || isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">{t("months6")}</SelectItem>
              <SelectItem value="12">{t("months12")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {role === UserRoles.TEACHER && (
          <div>
            <label
              htmlFor="ratePerClassCents"
              className="block text-sm font-medium mb-1"
            >
              {t("ratePerClass")}
            </label>
            <Input
              id="ratePerClassCents"
              type="number"
              step="0.01"
              min="0"
              value={ratePerClassReais ?? 25}
              onChange={(e) => {
                const v = e.target.value;
                setRatePerClassReais(v === "" ? undefined : Number(v));
              }}
              disabled={!canEditUser || isLoading}
            />
          </div>
        )}

        {(role === UserRoles.TEACHER ||
          role === UserRoles.STUDENT ||
          role === UserRoles.GUARDED_STUDENT) && (
          <div>
            <span className="block text-sm font-medium mb-1">
              {role === UserRoles.TEACHER
                ? t("teachingLanguages")
                : t("studyingLanguages")}
            </span>
            <div className="flex flex-wrap gap-3">
              {["Inglês", "Espanhol", "Libras"].map((lang) => {
                const checked = selectedLanguages.includes(lang);
                return (
                  <label key={lang} className="flex items-center gap-2">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(val) => {
                        const isChecked = Boolean(val);
                        setSelectedLanguages((prev) =>
                          isChecked
                            ? [...prev, lang]
                            : prev.filter((l) => l !== lang),
                        );
                      }}
                      disabled={!canEditUser || isLoading}
                    />
                    <span>{tLangs(lang)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {canEditUser && (
        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveChanges} disabled={isLoading}>
            {isLoading ? <Spinner className="h-5 w-5" /> : t("save")}
          </Button>
        </div>
      )}
    </Card>
  );
}
