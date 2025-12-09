"use client";

import { useEffect, useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import { UserRoles } from "@/types/users/userRoles";
import { toast } from "sonner";

// Importações dos seus componentes de UI
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
import { Text } from "@/components/ui/text";
import AddUserModal from "./AddUserModal";
import { useAdmin } from "@/hooks/useAdmin";
import { useRouter } from "next/navigation";
import { SubContainer } from "../ui/sub-container";
import { Spinner } from "../ui/spinner";
import { DotSquareIcon } from "lucide-react";

export default function UserManagementTable() {
  const {
    users,
    isLoading: isLoadingUsers,
    fetchUsers,
    updateUserStatus,
  } = useUsers();
  const {
    createUser,
    isLoading: isCreatingUser,
    error: adminError,
    successMessage: adminSuccess,
  } = useAdmin();

  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
    router.push(`/hub/plataforma/users/${encodedName}?id=${userId}`);
  };

  return (
    <SubContainer>
      {/* <Header
        heading={"Gerenciamento de Usuários"}
        icon={
          <UserPlus
            weight="BoldDuotone"
            className="w-8 h-8 text-primary hover:text-primary-hover duration-300 ease-in-out transition-all cursor-pointer"
            onClick={() => setIsAddModalOpen(true)}
          />
        }
      /> */}

      <div className="flex flex-col md:flex-row gap-4 my-4">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por Papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Papéis</SelectItem>
            {Object.values(UserRoles).map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoadingUsers && <Spinner />}

      {!isLoadingUsers && users.length > 0 && (
        <div className="rounded-lg border-1 border-card/95 bg-card/75 p-4 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-subtitle">Usuário</TableHead>
                <TableHead className="text-subtitle">Tipo</TableHead>
                <TableHead className="text-subtitle">Status</TableHead>
                <TableHead className="text-right text-paragraph">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-500">
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  onClick={() => handleRowClick(user.id, user.name)}
                  className="cursor-pointer hover:bg-card/95"
                >
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <Text variant="paragraph" weight="medium">
                          {user.name}
                        </Text>
                        <Text size="sm" variant="placeholder">
                          {user.email}
                        </Text>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      // variant={user.isActive ? "success" : "danger"}
                    >
                      {user.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="glass" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <DotSquareIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() =>
                            updateUserStatus(user.id, !user.isActive)
                          }
                        >
                          {user.isActive ? "Desativar" : "Reativar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleRowClick(user.id, user.name)}
                        >
                          Editar Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-danger hover:bg-danger/20 hover:text-danger">
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserCreated={handleUserCreated}
        isLoading={isLoadingUsers}
      />
    </SubContainer>
  );
}
