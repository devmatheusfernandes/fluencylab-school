"use client";

import { useEffect, useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import { UserRoles } from "@/types/users/userRoles";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddUserModal from "./AddUserModal";
import { useAdmin } from "@/hooks/useAdmin";
import { useRouter } from "next/navigation";
import { Spinner } from "../ui/spinner";
import { EllipsisVertical, UserPlus } from "lucide-react";
import { Card } from "../ui/card";
import { ButtonGroup } from "../ui/button-group";

export default function UserManagementTable() {
  const {
    users,
    isLoading: isLoadingUsers,
    fetchUsers,
    updateUserStatus,
  } = useUsers();
  const {
    createUser,
    error: adminError,
    successMessage: adminSuccess,
  } = useAdmin();

  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const t = useTranslations("UserManagement");
  const tRoles = useTranslations("UserRoles");

  // Efeito para buscar os dados quando os filtros mudam
  useEffect(() => {
    const filters = {
      role: roleFilter === "all" ? undefined : roleFilter,
      isActive: statusFilter === "all" ? undefined : statusFilter === "active",
    };
    fetchUsers(filters);
  }, [roleFilter, statusFilter, fetchUsers]);

  useEffect(() => {
    if (adminError) toast.error(adminError);
  }, [adminError]);
  useEffect(() => {
    if (adminSuccess) toast.success(adminSuccess);
  }, [adminSuccess]);

  const handleUserCreated = async (userData: {
    name: string;
    email: string;
    role: UserRoles;
  }) => {
    const success = await createUser(userData);
    if (success) {
      setIsAddModalOpen(false); // Fecha o modal
      await fetchUsers({
        // Recarrega a lista com os filtros atuais
        role: roleFilter === "all" ? undefined : roleFilter,
        isActive:
          statusFilter === "all" ? undefined : statusFilter === "active",
      });
    }
  };

  const handleRowClick = (userId: string, userName: string) => {
    // Formata o nome para ser seguro para a URL (minúsculas, sem espaços)
    const sanitizedName = userName.toLowerCase().replace(/\s+/g, "-");
    const encodedName = encodeURIComponent(sanitizedName);
    router.push(`/hub/admin/users/${encodedName}?id=${userId}`);
  };

  return (
    <>
      <div className="flex flex-col justify-between md:flex-row gap-4 my-4">
        <div className="flex flex-row justify-between items-center gap-2">
          <ButtonGroup>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder={t("filterByRole")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allRoles")}</SelectItem>
            {Object.values(UserRoles).map((role) => (
              <SelectItem key={role} value={role}>
                {tRoles(role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t("filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatus")}</SelectItem>
            <SelectItem value="active">{t("active")}</SelectItem>
            <SelectItem value="inactive">{t("inactive")}</SelectItem>
          </SelectContent>
        </Select>
        </ButtonGroup>
        <Button variant="outline">
        <UserPlus
            className="w-4 h-4 text-foreground"
            onClick={() => setIsAddModalOpen(true)}
          />
          </Button>
        </div>        
      </div>

      {isLoadingUsers && <Spinner />}

      {!isLoadingUsers && users.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-subtitle">{t("user")}</TableHead>
                <TableHead className="text-subtitle">{t("type")}</TableHead>
                <TableHead className="text-right">
                  {t("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-500">
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  onClick={() => handleRowClick(user.id, user.name)}
                  className="cursor-pointer hover:text-primary"
                >
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <p className="capitalize font-bold text-lg">
                          {user.name}
                        </p>
                        <p className="text-sm opacity-70">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" >
                      <span className="capitalize">{tRoles(user.role)}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="glass" className="h-8 w-8 p-0">
                          <span className="sr-only">{t("openMenu")}</span>
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() =>
                            updateUserStatus(user.id, !user.isActive)
                          }
                        >
                          {user.isActive ? t("deactivate") : t("reactivate")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleRowClick(user.id, user.name)}
                        >
                          {t("editProfile")}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive hover:bg-destructive/20! hover:text-destructive!">
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserCreated={handleUserCreated}
        isLoading={isLoadingUsers}
      />
    </>
  );
}
