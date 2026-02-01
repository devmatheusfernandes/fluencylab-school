import { useTranslations } from "next-intl";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FullUserDetails } from "@/types/users/userDetails";
import { UserPermission } from "@/types/users/userPermissions";
import { useAdmin } from "@/hooks/admin/useAdmin";
import { useCan } from "@/hooks/auth/useCurrentUser";
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
  "student": [
    "class.view",
    "class.cancel.self",
    "class.reschedule.self",
    "contract.view.self",
    "profile.update.self",
    "feedback.create",
    "payment.view.self",
    "credits.view.self",
  ],
  "teacher": [
    "class.view.assigned",
    "class.update.status",
    "class.reschedule.teacher",
    "vacation.create",
    "vacation.view",
    "student.feedback.read",
    "class.create.with.credits",
    "credits.view.students",
  ],
  "admin": [
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
  "managerSupport": [
    "student.support",
    "teacher.support",
    "report.view.limited",
    "credits.grant",
    "credits.view.assigned",
  ],
  "materialManager": [
    "material.create",
    "material.update",
    "material.delete",
    "material.view",
  ],
};

export default function UserPermissionsTab({ user }: UserPermissionsTabProps) {
  const t = useTranslations("UserDetails.permissions");
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
      toast.success(t("successUpdate"));
    } else {
      toast.error(t("errorUpdate"));
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
          {t("noPermission")}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{t("managePermissions")}</h3>
        <p className="text-subtitle mb-4">
          {t("currentPermissionsCount", { count: userPermissions.length, total: allPermissions.length })}
        </p>
        <div className="flex gap-2">
          <Button onClick={handleRolePermissions} disabled={isLoading}>
            {t("restoreDefault")}
          </Button>
          <Button onClick={handleSavePermissions} disabled={isLoading}>
            {isLoading ? t("saving") : t("savePermissions")}
          </Button>
        </div>
        <div className="mt-4 max-w-md">
          <Input
            placeholder={t("searchPermissions")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {isEditingSelf && (
          <p className="text-destructive mt-2">
            {t("cannotEditSelf")}
          </p>
        )}
      </div>

      <div className="space-y-8">
        {Object.entries(permissionGroups).map(([groupKey, permissions]) => {
          const visible = permissions.filter((p) =>
            (t(`labels.${p.replace(/\./g, '_')}`) || p)
              .toLowerCase()
              .includes(query.toLowerCase())
          );
          if (visible.length === 0) return null;
          return (
            <div key={groupKey}>
              <h4 className="text-md font-semibold mb-3 border-b pb-1">
                {t(`groups.${groupKey}`)}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visible.map((permission) => {
                  const label = t(`labels.${permission.replace(/\./g, '_')}`);
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
          {isLoading ? t("saving") : t("savePermissions")}
        </Button>
      </div>
    </Card>
  );
}
