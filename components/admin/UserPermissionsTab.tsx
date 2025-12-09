"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FullUserDetails } from "@/types/users/user-details";
import { UserPermission } from "@/types/users/userPermissions";
import { useAdmin } from "@/hooks/useAdmin";
import { useCan } from "@/hooks/useCurrentUser";
import { rolePermissionsMap } from "@/config/permissions";
import { UserRoles } from "@/types/users/userRoles";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface UserPermissionsTabProps {
  user: FullUserDetails;
}

// Get all possible permissions
const allPermissions: UserPermission[] = [
  // Student / Guarded
  "class.view",
  "class.cancel.self",
  "class.reschedule.self",
  "contract.view.self",
  "profile.update.self",
  "feedback.create",
  "payment.view.self",
  "credits.view.self",

  // Teacher
  "class.view.assigned",
  "class.update.status",
  "class.reschedule.teacher",
  "vacation.create",
  "vacation.view",
  "student.feedback.read",
  "class.create.with.credits",
  "credits.view.students",

  // Admin
  "user.create",
  "user.update",
  "user.delete",
  "class.view.all",
  "class.update.any",
  "contract.create",
  "contract.update",
  "vacation.override",
  "report.view",
  "payment.manage",
  "credits.manage",
  "credits.grant",
  "credits.view.all",

  // Manager / Support
  "student.support",
  "teacher.support",
  "report.view.limited",
  "credits.grant",
  "credits.view.assigned",

  // Material Manager
  "material.create",
  "material.update",
  "material.delete",
  "material.view",
];

// Group permissions by category for better organization
const permissionGroups: Record<string, UserPermission[]> = {
  "Student Permissions": [
    "class.view",
    "class.cancel.self",
    "class.reschedule.self",
    "contract.view.self",
    "profile.update.self",
    "feedback.create",
    "payment.view.self",
    "credits.view.self",
  ],
  "Teacher Permissions": [
    "class.view.assigned",
    "class.update.status",
    "class.reschedule.teacher",
    "vacation.create",
    "vacation.view",
    "student.feedback.read",
    "class.create.with.credits",
    "credits.view.students",
  ],
  "Admin Permissions": [
    "user.create",
    "user.update",
    "user.delete",
    "class.view.all",
    "class.update.any",
    "contract.create",
    "contract.update",
    "vacation.override",
    "report.view",
    "payment.manage",
    "credits.manage",
    "credits.grant",
    "credits.view.all",
  ],
  "Manager/Support Permissions": [
    "student.support",
    "teacher.support",
    "report.view.limited",
    "credits.grant",
    "credits.view.assigned",
  ],
  "Material Manager Permissions": [
    "material.create",
    "material.update",
    "material.delete",
    "material.view",
  ],
};

export default function UserPermissionsTab({ user }: UserPermissionsTabProps) {
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>(
    user.permissions || []
  );
  const { updateUser, isLoading } = useAdmin();
  const canManagePermissions = useCan("user.update");
  const { data: session } = useSession();
  const currentRole = (session?.user?.role as UserRoles | undefined) || undefined;
  const isEditingSelf = session?.user?.id === user.id;
  const [query, setQuery] = useState("");

  const adminOnly: UserPermission[] = [
    "user.delete",
    "class.view.all",
    "class.update.any",
    "contract.create",
    "contract.update",
    "vacation.override",
    "report.view",
    "payment.manage",
    "credits.manage",
    "credits.view.all",
  ];

  const permissionMeta: Record<UserPermission, { label: string; description?: string }> = {
    "class.view": { label: "Ver aulas" },
    "class.cancel.self": { label: "Cancelar próprias aulas" },
    "class.reschedule.self": { label: "Reagendar próprias aulas" },
    "contract.view.self": { label: "Ver contratos" },
    "profile.update.self": { label: "Atualizar perfil" },
    "feedback.create": { label: "Enviar feedback" },
    "payment.view.self": { label: "Ver pagamentos" },
    "credits.view.self": { label: "Ver créditos" },
    "class.view.assigned": { label: "Ver aulas atribuídas" },
    "class.update.status": { label: "Atualizar status das aulas" },
    "class.reschedule.teacher": { label: "Reagendar aulas" },
    "vacation.create": { label: "Registrar férias" },
    "vacation.view": { label: "Ver férias" },
    "student.feedback.read": { label: "Ler feedbacks dos alunos" },
    "class.create.with.credits": { label: "Criar aulas com créditos" },
    "credits.view.students": { label: "Ver créditos dos alunos" },
    "user.create": { label: "Criar usuário" },
    "user.update": { label: "Editar usuário" },
    "user.delete": { label: "Excluir usuário" },
    "class.view.all": { label: "Ver todas as aulas" },
    "class.update.any": { label: "Editar quaisquer aulas" },
    "contract.create": { label: "Criar contrato" },
    "contract.update": { label: "Atualizar contrato" },
    "vacation.override": { label: "Modificar férias" },
    "report.view": { label: "Ver relatórios" },
    "payment.manage": { label: "Gerir pagamentos" },
    "credits.manage": { label: "Gerir créditos" },
    "credits.grant": { label: "Conceder créditos" },
    "credits.view.all": { label: "Ver todos os créditos" },
    "student.support": { label: "Suporte ao aluno" },
    "teacher.support": { label: "Suporte ao professor" },
    "report.view.limited": { label: "Ver relatórios limitados" },
    "credits.view.assigned": { label: "Ver créditos atribuídos" },
    "material.create": { label: "Criar material" },
    "material.update": { label: "Atualizar material" },
    "material.delete": { label: "Excluir material" },
    "material.view": { label: "Ver material" },
  };

  const handlePermissionChange = (
    permission: UserPermission,
    checked: boolean
  ) => {
    if (isEditingSelf) return;
    if (adminOnly.includes(permission) && currentRole !== UserRoles.ADMIN) return;
    if (checked) {
      // Add permission
      setUserPermissions([...userPermissions, permission]);
    } else {
      // Remove permission
      setUserPermissions(userPermissions.filter((p) => p !== permission));
    }
  };

  const handleSavePermissions = async () => {
    const filtered = userPermissions
      .filter((p, i, arr) => arr.indexOf(p) === i)
      .filter((p) =>
        currentRole === UserRoles.ADMIN ? true : !adminOnly.includes(p)
      );
    const success = await updateUser(user.id, {
      permissions: filtered,
    });
    if (success) {
      toast.success("Permissões atualizadas com sucesso!");
    } else {
      toast.error("Ocorreu um erro ao atualizar as permissões.");
    }
  };

  const handleRolePermissions = () => {
    // Get default permissions for the user's role
    const rolePermissions = rolePermissionsMap[user.role as UserRoles] || [];
    setUserPermissions([...rolePermissions]);
  };

  const isPermissionChecked = (permission: UserPermission) => {
    return userPermissions.includes(permission);
  };

  if (!canManagePermissions) {
    return (
      <Card className="p-6">
        <p className="text-subtitle">
          Você não tem permissão para gerenciar permissões de usuários.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Gerenciar Permissões</h3>
        <p className="text-subtitle mb-4">
          Permissões atuais do usuário: {userPermissions.length} de{" "}
          {allPermissions.length}
        </p>
        <div className="flex gap-2">
          <Button onClick={handleRolePermissions} disabled={isLoading}>
            Restaurar Permissões Padrão do Cargo
          </Button>
          <Button onClick={handleSavePermissions} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Permissões"}
          </Button>
        </div>
        <div className="mt-4 max-w-md">
          <Input
            placeholder="Buscar permissões"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {isEditingSelf && (
          <p className="text-destructive mt-2">
            Não é possível editar as próprias permissões.
          </p>
        )}
      </div>

      <div className="space-y-8">
        {Object.entries(permissionGroups).map(([groupName, permissions]) => {
          const visible = permissions.filter((p) =>
            (permissionMeta[p]?.label || p)
              .toLowerCase()
              .includes(query.toLowerCase())
          );
          if (visible.length === 0) return null;
          return (
            <div key={groupName}>
              <h4 className="text-md font-semibold mb-3 border-b pb-1">
                {groupName}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visible.map((permission) => {
                  const label = permissionMeta[permission]?.label || permission;
                  const disabled =
                    isLoading ||
                    isEditingSelf ||
                    (adminOnly.includes(permission) &&
                      currentRole !== UserRoles.ADMIN);
                  return (
                    <div key={permission} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission}
                        checked={isPermissionChecked(permission)}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(permission, checked as boolean)
                        }
                        disabled={disabled}
                      />
                      <label
                        htmlFor={permission}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {label}
                      </label>
                      {adminOnly.includes(permission) && (
                        <Badge variant="outline">Admin</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSavePermissions} disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Permissões"}
        </Button>
      </div>
    </Card>
  );
}
