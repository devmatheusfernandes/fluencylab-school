// app/hub/plataforma/users/[userName]/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserService } from "@/services/userService";
import { userAdminRepository } from "@/repositories"; // Importa instância singleton
import { redirect } from "next/navigation";
import { Text } from "@/components/ui/text";
import UserDetailsClient from "@/components/admin/UseDetailsClient";

const userService = new UserService();
const userAdminRepo = userAdminRepository; // Usa instância singleton

// As props da página agora incluem 'params' e 'searchParams'
interface UserDetailsPageProps {
  params: { userName: string }; // O nome vem do caminho da URL
  searchParams: { id?: string }; // O ID vem dos parâmetros de busca (?id=...)
}

export default async function UserDetailsPage({
  params,
  searchParams,
}: UserDetailsPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }

  const { id: userId } = await searchParams;

  if (!userId) {
    return (
      <div>
        <Text variant="title" size="xl">
          ID do utilizador em falta
        </Text>
        <Text>Não foi possível encontrar o ID do utilizador na URL.</Text>
      </div>
    );
  }

  // Busca os detalhes do utilizador E a lista de todos os professores em paralelo
  const [userDetails, allTeachers] = await Promise.all([
    userService.getFullUserDetails(userId),
    userAdminRepo.findUsersByRole("teacher"),
  ]);

  const plainUserDetails = JSON.parse(JSON.stringify(userDetails));

  if (!userDetails) {
    return (
      <div>
        <Text variant="title" size="xl">
          Utilizador não encontrado
        </Text>
        <Text>O utilizador com o ID especificado não foi encontrado.</Text>
      </div>
    );
  }

  // Passa os dados completos, incluindo a lista de professores, para o componente de cliente
  return (
    <UserDetailsClient user={plainUserDetails} allTeachers={allTeachers} />
  );
}
