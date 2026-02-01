// app/hub/plataforma/users/[userName]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserService } from "@/services/core/userService";
import { userAdminRepository, planRepository } from "@/repositories";
import { redirect } from "next/navigation";
import { NoResults } from "@/components/ui/no-results";
import UserDetailsClient from "@/components/admin/UserDetailsClient";

const userService = new UserService();
const userAdminRepo = userAdminRepository;

interface UserDetailsPageProps {
  params: { userName: string };
  searchParams: { id?: string }; 
}

export default async function UserDetailsPage({
  searchParams,
}: UserDetailsPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }

  const { id: userId } = await searchParams;

  if (!userId) {
    return (
      <NoResults
        customMessage={{ withoutSearch: "ID de Usuário não encontrado" }}
        className="py-10"
      />
    );
  }

  // Busca os detalhes do utilizador e a lista de todos os professores em paralelo
  const [userDetails, allTeachers, activePlan, templates] = await Promise.all([
    userService.getFullUserDetails(userId),
    userAdminRepo.findUsersByRole("teacher"),
    planRepository.findActivePlanByStudent(userId),
    planRepository.findTemplates(),
  ]);

  const plainUserDetails = JSON.parse(JSON.stringify(userDetails));

  if (!userDetails) {
    return (
      <NoResults
        customMessage={{ withoutSearch: "Usuário não encontrado" }}
        className="py-10"
      />
    );
  }

  return (
    <UserDetailsClient 
        user={plainUserDetails} 
        allTeachers={allTeachers} 
        activePlan={JSON.parse(JSON.stringify(activePlan))} 
        templates={JSON.parse(JSON.stringify(templates))}
    />
  );
}
