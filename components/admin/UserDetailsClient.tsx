"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FullUserDetails } from "@/types/users/userDetails";
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
import { useTranslations } from "next-intl";
import { BackButton } from "../ui/back-button";
import UserPlanTab from "./UserPlanTab";
import { Plan } from "@/types/learning/plan";

interface UserDetailsClientProps {
  user: FullUserDetails;
  allTeachers: User[];
  activePlan: Plan | null;
  templates: Plan[];
}

export default function UserDetailsClient({
  user,
  allTeachers,
  activePlan,
  templates,
}: UserDetailsClientProps) {
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role as UserRoles | undefined;
  const t = useTranslations("UserDetails.tabs");

  return (
    <div className="p-3 px-6 ">
      <Tabs defaultValue="overview">
        <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-row gap-2 items-center">
            <BackButton href="/hub/admin/users" />
            <div className="flex items-center">
              <Avatar size="md">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback />
              </Avatar>
              <div className="ml-2">
                <p className="capitalize text-2xl font-bold">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>

          <TabsList className="mt-0 flex-wrap h-full">
            <TabsTrigger value="overview">{t("overview")}</TabsTrigger>

            {user.role === "student" && (
              <>
                <TabsTrigger value="plan">{t("plan") || "Plano"}</TabsTrigger>
                <TabsTrigger value="schedule">{t("schedule")}</TabsTrigger>
                <TabsTrigger value="classes">{t("classes")}</TabsTrigger>
                <TabsTrigger value="credits">{t("credits")}</TabsTrigger>
              </>
            )}
            <TabsTrigger value="financial">{t("financial")}</TabsTrigger>
            <TabsTrigger value="contracts">{t("contracts")}</TabsTrigger>

            {currentUserRole === UserRoles.ADMIN && (
              <TabsTrigger value="permissions">{t("permission")}</TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <UserOverviewTab user={user} />
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <UserPlanTab
            studentId={user.id}
            activePlan={activePlan}
            templates={templates}
            hasClasses={
              !!(user.scheduledClasses && user.scheduledClasses.length > 0)
            }
            totalScheduledClasses={user.scheduledClasses?.length || 0}
          />
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
          <UserContractsTab
            user={user}
            currentUserRole={currentUserRole || UserRoles.STUDENT}
          />
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
