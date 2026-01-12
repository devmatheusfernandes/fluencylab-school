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
import { Skeleton } from "@/components/ui/skeleton";
import AddUserModal from "./AddUserModal";
import { useAdmin } from "@/hooks/useAdmin";
import { useRouter } from "next/navigation";
import { EllipsisVertical, UserPlus } from "lucide-react";
import { Card } from "../ui/card";
import { Input } from "@/components/ui/input";
import { NoResults } from "@/components/ui/no-results";
import { Search } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const t = useTranslations("UserManagement");
  const tRoles = useTranslations("UserRoles");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const filters = {
      role: roleFilter === "all" ? undefined : roleFilter,
      isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      search: debouncedSearch || undefined,
    };
    fetchUsers(filters);
  }, [roleFilter, statusFilter, debouncedSearch, fetchUsers]);

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
      setIsAddModalOpen(false);
      await fetchUsers({
        role: roleFilter === "all" ? undefined : roleFilter,
        isActive:
          statusFilter === "all" ? undefined : statusFilter === "active",
        search: debouncedSearch || undefined,
      });
    }
  };

  const handleRowClick = (userId: string, userName: string) => {
    const sanitizedName = userName.toLowerCase().replace(/\s+/g, "-");
    const encodedName = encodeURIComponent(sanitizedName);
    router.push(`/hub/admin/users/${encodedName}?id=${userId}`);
  };

  // Componente interno para o Skeleton das Linhas
  const TableRowsSkeleton = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-4 space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
            </div>
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-8 w-8 rounded-md ml-auto" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 my-4">
        <div className="w-full md:w-auto flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder") || "Buscar por nome, email ou CPF..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="w-full flex flex-col sm:flex-row gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
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
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t("filterByStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allStatus")}</SelectItem>
                    <SelectItem value="active">{t("active")}</SelectItem>
                    <SelectItem value="inactive">{t("inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
        </div>
        
        <Button 
          onClick={() => setIsAddModalOpen(true)} 
          variant="glass"
          className="w-full md:w-auto" 
        >
          <UserPlus className="w-4 h-4 text-primary" />
        </Button>
      </div>

      <Card className="overflow-hidden"> 
        <div className="overflow-x-auto"> 
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-subtitle w-full md:w-auto">{t("user")}</TableHead>
                <TableHead className="text-subtitle hidden sm:table-cell">{t("type")}</TableHead>
                <TableHead className="text-right w-[50px]">
                  {t("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-500">
              {isLoadingUsers ? (
                <TableRowsSkeleton />
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    onClick={() => handleRowClick(user.id, user.name)}
                    className="cursor-pointer hover:text-primary"
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-9 w-9 md:h-10 md:w-10">
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-3 md:ml-4 flex flex-col">
                          <span className="capitalize font-bold text-sm md:text-lg">
                            {user.name}
                          </span>
                          <span className="text-xs md:text-sm opacity-70 truncate max-w-[150px] md:max-w-none">
                            {user.email}
                          </span>
                          <div className="sm:hidden mt-1">
                             <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                {tRoles(user.role)}
                             </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="default">
                        <span className="capitalize">{tRoles(user.role)}</span>
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="sr-only">{t("openMenu")}</span>
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={(e) => {
                                e.stopPropagation();
                                updateUserStatus(user.id, !user.isActive);
                            }}
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
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        <NoResults searchQuery={debouncedSearch} />
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserCreated={handleUserCreated}
        isLoading={isLoadingUsers}
      />
    </>
  );
}