"use client";

import { FullUserDetails } from "@/types/users/userDetails";
import { User } from "@/types/users/users";
import { Plan } from "@/types/learning/plan";
import { StudentProfile } from "@/types/students/studentProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

// Admin components
import UserPlanTab from "@/components/admin/UserPlanTab";
import UserClassesTab from "@/components/admin/UserClassesTab";
import UserFinancialTab from "@/components/admin/UserFinancialTab";
import UserScheduleManager from "@/components/admin/UsersScheduleManager";
import RoadmapTab from "./RoadmapTab";

interface StudentProfileTabsProps {
  user: FullUserDetails | null;
  profile: StudentProfile;
  allTeachers: User[];
  activePlan: Plan | null;
  templates: Plan[];
}

export default function StudentProfileTabs({
  user,
  profile,
  allTeachers,
  activePlan,
  templates,
}: StudentProfileTabsProps) {
  const t = useTranslations("UserDetails.tabs");

  if (!user) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Não Associado</AlertTitle>
        <AlertDescription>
          Associe este perfil a um aluno para ver o plano, aulas e financeiro.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Tabs defaultValue="plan" className="w-full space-y-6">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="plan">{t("plan") || "Plano"}</TabsTrigger>
        {profile.generatedPromptPlan && (
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
        )}
        <TabsTrigger value="schedule">{t("schedule") || "Horários"}</TabsTrigger>
        <TabsTrigger value="classes">{t("classes") || "Aulas"}</TabsTrigger>
        <TabsTrigger value="financial">{t("financial") || "Financeiro"}</TabsTrigger>
      </TabsList>

      <TabsContent value="plan" className="space-y-4">
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

      {profile.generatedPromptPlan && (
        <TabsContent value="roadmap" className="space-y-4">
            <RoadmapTab profile={profile} />
        </TabsContent>
      )}

      <TabsContent value="schedule" className="space-y-4">
        <UserScheduleManager user={user} allTeachers={allTeachers} />
      </TabsContent>

      <TabsContent value="classes" className="space-y-4">
        <UserClassesTab classes={user.scheduledClasses || []} />
      </TabsContent>

      <TabsContent value="financial" className="space-y-4">
        <UserFinancialTab user={user} />
      </TabsContent>
    </Tabs>
  );
}
