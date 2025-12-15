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
    <div className="p-3 px-6">
      <Tabs defaultValue="overview">
        <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <Avatar size="md">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-2">
              <p className="capitalize text-2xl font-bold">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <TabsList className="mt-0 flex-wrap h-full">
            <TabsTrigger value="overview">Geral</TabsTrigger>

            {user.role === "student" && (
              <>
                <TabsTrigger value="schedule">Horário</TabsTrigger>
                <TabsTrigger value="classes">Aulas</TabsTrigger>
                <TabsTrigger value="credits">Créditos</TabsTrigger>
              </>
            )}
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>

            {currentUserRole === UserRoles.ADMIN && (
              <TabsTrigger value="permissions">Permissões</TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <UserOverviewTab user={user} />
        </TabsContent>

        <TabsContent value="classes" className="mt-4">
          <UserClassesTab classes={user.scheduledClasses || []} />
        </TabsContent>

        <TabsContent value="credits" className="mt-4">
          <UserCreditsTab studentId={user.id} />
        </TabsContent>
        <TabsContent value="financial" className="mt-4">
          <UserFinancialTab user={user} />
        </TabsContent>

        <TabsContent value="contracts" className="mt-4">
          <UserContractsTab user={user} currentUserRole={user.role} />
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <UserScheduleManager user={user} allTeachers={allTeachers} />
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <UserPermissionsTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
