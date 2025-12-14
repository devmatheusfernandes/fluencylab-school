import TeacherVacationManager from "@/components/teacher/TeacherVacationManager";
import TeacherSettingsForm from "@/components/teacher/TeacherSettingsForm";
import TeacherSettingsClient from "@/components/teacher/TeacherSettingsClient";

import { SchedulingService } from "@/services/schedulingService";
import { UserAdminRepository } from "@/repositories/user.admin.repository";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import {
  mapTeacherEventsToCalendar,
  mapTeacherClassesToCalendar,
} from "@/lib/calendar/calendarUtils";

import { serializeForClientComponent } from "@/utils/utils";
import { Card } from "@/components/ui/card";
import { BadgePoundSterling, Calendar, Ear, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";

const userAdminRepo = new UserAdminRepository();
const schedulingService = new SchedulingService();

export default async function TeacherSettingsPage() {
  const session = await getServerSession(authOptions);

  // Busca as configurações atuais do professor para preencher o formulário
  const teacher = await userAdminRepo.findUserById(session!.user.id);
  const currentSettings = {
    bookingLeadTimeHours:
      teacher?.schedulingSettings?.bookingLeadTimeHours ?? 24,
    cancellationPolicyHours:
      teacher?.schedulingSettings?.cancellationPolicyHours ?? 24,
    bookingHorizonDays: teacher?.schedulingSettings?.bookingHorizonDays ?? 30,
  };

  // Fetch teacher's schedule data
  const scheduleData = await schedulingService.getTeacherAvailability(
    session!.user.id
  );

  // Fetch all teacher's classes
  const allClasses = await schedulingService.getPopulatedClassesForTeacher(
    session!.user.id
  );

  // // Debug logs
  // console.log("[DEBUG] Schedule Data:", {
  //   slots: scheduleData.slots?.length || 0,
  //   exceptions: scheduleData.exceptions?.length || 0,
  //   bookedClasses: scheduleData.bookedClasses?.length || 0,
  //   slotsData: scheduleData.slots,
  // });

  // Combine availability slots with all classes
  const calendarEvents = [
    ...mapTeacherEventsToCalendar(
      scheduleData.slots,
      scheduleData.exceptions,
      scheduleData.bookedClasses
    ),
    ...mapTeacherClassesToCalendar(allClasses),
  ];

  // console.log(
  //   "[DEBUG] Calendar Events Generated:",
  //   calendarEvents.length,
  //   calendarEvents
  // );

  // Serialize data before passing to Client Component
  const serializedEvents = serializeForClientComponent(calendarEvents);
  const serializedClasses = serializeForClientComponent(allClasses);
  const serializedScheduleData = serializeForClientComponent(scheduleData);

  return (
    <Tabs defaultValue="settings">
      <div className="flex flex-row items-center justify-center w-full">
        <TabsList className="flex flex-wrap bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg font-medium"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configurações</span>
              <span className="sm:hidden">Configurações</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="vacation"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg font-medium"
          >
            <div className="flex items-center gap-2">
              <Ear className="w-4 h-4" />
              <span className="hidden sm:inline">Férias</span>
              <span className="sm:hidden">Férias</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg font-medium"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Agenda</span>
              <span className="sm:hidden">Agenda</span>
            </div>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Settings Tab */}
      <TabsContent value="settings" className="space-y-6">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Text
                  size="lg"
                  className="font-bold text-slate-900 dark:text-slate-100"
                >
                  Regras de Agendamento
                </Text>
                <Text size="sm" className="text-slate-600 dark:text-slate-400">
                  Configure as políticas para seus alunos agendarem aulas
                </Text>
              </div>
            </div>
          </div>
          <div className="p-0">
            <TeacherSettingsForm currentSettings={currentSettings} />
          </div>
        </Card>
      </TabsContent>

      {/* Vacation Tab */}
      <TabsContent value="vacation" className="space-y-6">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <BadgePoundSterling className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <Text className="font-bold text-slate-900 dark:text-slate-100">
                  Gestão de Férias
                </Text>
                <Text size="sm" className="text-slate-600 dark:text-slate-400">
                  Solicite períodos de férias e gerencie sua disponibilidade
                  você tem {teacher?.vacationDaysRemaining || 0} dias restantes
                </Text>
              </div>
            </div>
          </div>
          <div className="p-0">
            <TeacherVacationManager />
          </div>
        </Card>
      </TabsContent>

      {/* Schedule Tab */}
      <TabsContent value="schedule" className="space-y-6">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <Text
                  size="lg"
                  className="font-bold text-slate-900 dark:text-slate-100"
                >
                  Agenda e Disponibilidade
                </Text>
                <Text size="sm" className="text-slate-600 dark:text-slate-400">
                  Visualize e gerencie sua agenda completa
                </Text>
              </div>
            </div>
          </div>
          <div className="p-0 ">
            <TeacherSettingsClient
              initialEvents={serializedEvents}
              initialClasses={serializedClasses}
              initialScheduleData={serializedScheduleData}
              teacherId={session!.user.id}
            />
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
