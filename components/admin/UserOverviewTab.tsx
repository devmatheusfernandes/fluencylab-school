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
import { FullUserDetails } from "@/types/users/user-details";
import { UserRoles } from "@/types/users/userRoles";

interface UserOverviewTabProps {
  user: FullUserDetails;
}

export default function UserOverviewTab({ user }: UserOverviewTabProps) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [contractStartDate, setContractStartDate] = useState(
    user.contractStartDate
      ? new Date(user.contractStartDate).toISOString().split("T")[0]
      : ""
  );
  const [contractLengthMonths, setContractLengthMonths] = useState(
    user.contractLengthMonths || ""
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
            className="block text-sm font-medium text-subtitle"
          >
            Nome Completo
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEditUser || isLoading}
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-subtitle"
          >
            Email
          </label>
          <Input id="email" value={user.email} disabled />
        </div>
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-subtitle"
          >
            Tipo (Role)
          </label>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as UserRoles)}
            disabled={!canEditUser || isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(UserRoles).map((roleValue) => (
                <SelectItem key={roleValue} value={roleValue}>
                  {roleValue}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-subtitle">
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
            className="block text-sm font-medium text-subtitle"
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
            className="block text-sm font-medium text-subtitle"
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
      </div>
      {canEditUser && (
        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveChanges} disabled={isLoading}>
            {isLoading ? "A Salvar..." : "Salvar Alterações"}
          </Button>
        </div>
      )}
    </Card>
  );
}
