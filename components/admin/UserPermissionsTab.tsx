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

  const handlePermissionChange = (
    permission: UserPermission,
    checked: boolean
  ) => {
    if (checked) {
      // Add permission
      setUserPermissions([...userPermissions, permission]);
    } else {
      // Remove permission
      setUserPermissions(userPermissions.filter((p) => p !== permission));
    }
  };

  const handleSavePermissions = async () => {
    const success = await updateUser(user.id, {
      permissions: userPermissions,
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
      </div>

      <div className="space-y-8">
        {Object.entries(permissionGroups).map(([groupName, permissions]) => (
          <div key={groupName}>
            <h4 className="text-md font-semibold mb-3 border-b pb-1">
              {groupName}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permissions.map((permission) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Checkbox
                    id={permission}
                    checked={isPermissionChecked(permission)}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(permission, checked as boolean)
                    }
                    disabled={isLoading}
                  />
                  <label
                    htmlFor={permission}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {permission}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSavePermissions} disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Permissões"}
        </Button>
      </div>
    </Card>
  );
}
