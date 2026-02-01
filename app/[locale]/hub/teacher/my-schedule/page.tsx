import TeacherVacationManager from "@/components/teacher/TeacherVacationManager";
import TeacherSettingsForm from "@/components/teacher/TeacherSettingsForm";
import TeacherSettingsClient from "@/components/teacher/TeacherSettingsClient";

import { SchedulingService } from "@/services/learning/schedulingService";
import { UserAdminRepository } from "@/repositories/admin/userAdminRepository";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import {
  mapTeacherEventsToCalendar,
  mapTeacherClassesToCalendar,
} from "@/lib/calendar/utils";

import { serializeForClientComponent } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { BadgePoundSterling, Calendar, Ear, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/ui/header";

const userAdminRepo = new UserAdminRepository();
const schedulingService = new SchedulingService();

export default async function TeacherSettingsPage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("TeacherSchedule");

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
      scheduleData.bookedClasses,
      t
    ),
    ...mapTeacherClassesToCalendar(allClasses, t),
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
    <Tabs defaultValue="settings" className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Header heading={t("pageTitle")} subheading={t("pageSubtitle")} />
        <TabsList className="flex flex-wrap bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm w-full md:w-auto justify-center md:justify-start">
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg font-medium flex-1 md:flex-none"
          >
            <div className="flex items-center gap-2 justify-center">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{t("tabs.settings")}</span>
              <span className="sm:hidden">{t("tabs.settings")}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="vacation"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg font-medium flex-1 md:flex-none"
          >
            <div className="flex items-center gap-2 justify-center">
              <Ear className="w-4 h-4" />
              <span className="hidden sm:inline">{t("tabs.vacation")}</span>
              <span className="sm:hidden">{t("tabs.vacation")}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg font-medium flex-1 md:flex-none"
          >
            <div className="flex items-center gap-2 justify-center">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">{t("tabs.schedule")}</span>
              <span className="sm:hidden">{t("tabs.schedule")}</span>
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
                  {t("Settings.title")}
                </Text>
                <Text size="sm" className="text-slate-600 dark:text-slate-400">
                  {t("Settings.description")}
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
                  {t("Vacation.title")}
                </Text>
                <Text size="sm" className="text-slate-600 dark:text-slate-400">
                  {t("Vacation.description", {
                    days: teacher?.vacationDaysRemaining || 0,
                  })}
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
                  {t("Schedule.title")}
                </Text>
                <Text size="sm" className="text-slate-600 dark:text-slate-400">
                  {t("Schedule.description")}
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
