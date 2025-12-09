"use client";

import { Text } from "@/components/ui/text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FullUserDetails } from "@/types/users/user-details";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import UserOverviewTab from "./UserOverviewTab";
import UserClassesTab from "./UserClassesTab";
import UserFinancialTab from "./UserFinancialTab";

import { User } from "@/types/users/users";
import UserScheduleManager from "./UsersScheduleManager";
import UserCreditsTab from "./UserCreditsTab";
import UserContractsTab from "./UserContractsTab";
import UserPermissionsTab from "./UserPermissionsTab";
import { useSession } from "next-auth/react";
import { UserRoles } from "@/types/users/userRoles";

interface UserDetailsClientProps {
  user: FullUserDetails;
  allTeachers: User[];
}

export default function UserDetailsClient({
  user,
  allTeachers,
}: UserDetailsClientProps) {
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role as UserRoles | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.avatarUrl} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <Text variant="title" size="2xl" weight="bold">
            {user.name}
          </Text>
          <Text variant="subtitle">{user.email}</Text>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>

          <TabsTrigger value="schedule">Horário Fixo</TabsTrigger>

          <TabsTrigger value="classes">Aulas</TabsTrigger>
          {user.role === "student" && (
            <TabsTrigger value="credits">Créditos</TabsTrigger>
          )}
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          {currentUserRole === UserRoles.ADMIN && (
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <UserOverviewTab user={user} />
          {/* <TeacherAssociation student={user} allTeachers={allTeachers} /> */}
        </TabsContent>
        <TabsContent value="classes" className="mt-4">
          <UserClassesTab classes={user.scheduledClasses || []} />
        </TabsContent>
        {user.role === "student" && (
          <TabsContent value="credits" className="mt-4">
            <UserCreditsTab studentId={user.id} />
          </TabsContent>
        )}
        <TabsContent value="financial" className="mt-4">
          <UserFinancialTab user={user} />
        </TabsContent>
        <TabsContent value="contracts" className="mt-4">
          {currentUserRole ? (
            <UserContractsTab user={user} currentUserRole={currentUserRole} />
          ) : (
            <Text>Carregando informações do contrato...</Text>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <UserScheduleManager user={user} allTeachers={allTeachers} />
        </TabsContent>

        {currentUserRole === UserRoles.ADMIN && (
          <TabsContent value="permissions" className="mt-4">
            <UserPermissionsTab user={user} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
