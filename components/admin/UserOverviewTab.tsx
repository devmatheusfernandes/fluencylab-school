"use client";

import { useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useCan } from "@/hooks/useCurrentUser";
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
import { FullUserDetails } from "@/types/users/user-details";
import { UserRoles } from "@/types/users/userRoles";
import { useTranslations } from "next-intl";
import { Spinner } from "../ui/spinner";

interface UserOverviewTabProps {
  user: FullUserDetails;
}

export default function UserOverviewTab({ user }: UserOverviewTabProps) {
  const t = useTranslations("UserRoles");
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
    user.contractLengthMonths || (signedAt ? 6 : "")
  );
  const [ratePerClassReais, setRatePerClassReais] = useState<number | undefined>(
    user.ratePerClassCents != null ? user.ratePerClassCents / 100 : undefined
  );
  const [teacherLanguages, setTeacherLanguages] = useState<string[]>(
    user.languages || []
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
        ratePerClassReais == null ? undefined : Math.round(ratePerClassReais * 100),
      languages: teacherLanguages,
    });
    if (success) {
      toast.success("Perfil do utilizador salvo com sucesso!");
    } else {
      toast.error("Ocorreu um erro ao salvar o perfil.");
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium mb-1"
          >
            Nome Completo
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
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1"
          >
            Email
          </label>
          <Input id="email" value={user.email} disabled />
        </div>
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium mb-1"
          >
            Tipo
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
                <SelectItem className="capitalize" key={roleValue} value={roleValue}>
                  {t(roleValue)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Data de Criação
          </label>
          <Input
            value={new Date(user.createdAt).toLocaleDateString("pt-BR")}
            disabled
          />
        </div>
        <div>
          <label
            htmlFor="contractStartDate"
            className="block text-sm font-medium mb-1"
          >
            Data de Início do Contrato
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
            Duração do Contrato (Meses)
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
              <SelectItem value="6">6 Meses</SelectItem>
              <SelectItem value="12">12 Meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {role === UserRoles.TEACHER && (
          <>
            <div>
              <label
                htmlFor="ratePerClassCents"
                className="block text-sm font-medium mb-1"
              >
                Valor por Aula (R$)
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
            <div>
              <span className="block text-sm font-medium mb-1">
                Idiomas que Ensina
              </span>
              <div className="flex flex-wrap gap-3">
                {["Inglês", "Espanhol", "Libras"].map((lang) => {
                  const checked = teacherLanguages.includes(lang);
                  return (
                    <label key={lang} className="flex items-center gap-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(val) => {
                          const isChecked = Boolean(val);
                          setTeacherLanguages((prev) =>
                            isChecked
                              ? [...prev, lang]
                              : prev.filter((l) => l !== lang)
                          );
                        }}
                        disabled={!canEditUser || isLoading}
                      />
                      <span>{lang}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
      {canEditUser && (
        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveChanges} disabled={isLoading}>
            {isLoading ? <Spinner className="h-5 w-5" /> : "Salvar"}
          </Button>
        </div>
      )}
    </Card>
  );
}
