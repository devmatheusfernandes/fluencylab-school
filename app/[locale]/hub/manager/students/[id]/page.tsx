import { getStudentProfileById } from "@/actions/studentProfile";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { userService } from "@/services/core/userService";
import {
  userAdminRepository,
  planRepository,
  placementRepository,
} from "@/repositories";
import IntegrationProgress from "@/components/manager/IntegrationProgress";
import StudentProfileTabs from "@/components/manager/StudentProfileTabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function StudentProfileDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getStudentProfileById(id);
  const t = await getTranslations("StudentProfileList");

  if (!profile) {
    notFound();
  }

  // Parallel data fetching
  const [user, allTeachers, activePlan, templates, hasPlacement] =
    await Promise.all([
      profile.studentId
        ? userService.getFullUserDetails(profile.studentId)
        : Promise.resolve(null),
      userAdminRepository.findUsersByRole("teacher"),
      profile.studentId
        ? planRepository.findActivePlanByStudent(profile.studentId)
        : Promise.resolve(null),
      planRepository.findTemplates(),
      profile.studentId
        ? placementRepository.hasCompletedPlacement(profile.studentId)
        : Promise.resolve(false),
    ]);

  // Serialize to avoid "Date object" warnings in client components if passed directly
  const serializedUser = user ? JSON.parse(JSON.stringify(user)) : null;
  const serializedActivePlan = activePlan
    ? JSON.parse(JSON.stringify(activePlan))
    : null;
  const serializedTemplates = JSON.parse(JSON.stringify(templates));
  const serializedAllTeachers = JSON.parse(JSON.stringify(allTeachers));

  // Helper function to calculate age
  const calculateAge = (birthDate?: string | Date) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Determine display values (Profile > User > Null)
  const displayEmail = profile.email || serializedUser?.email;
  const displayPhone = profile.phoneNumber || serializedUser?.phoneNumber;
  const displayCity = profile.city || serializedUser?.address?.city;
  const displayAge =
    profile.age ||
    calculateAge(profile.birthDate) ||
    calculateAge(serializedUser?.birthDate);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hub/manager/student-profiles">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/hub/manager/student-profiles/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("edit")}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Summary Card */}
          <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={serializedUser?.avatarUrl} />
                <AvatarFallback className="text-2xl">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{profile.name}</h2>
              {displayEmail && (
                <p className="text-muted-foreground text-sm">{displayEmail}</p>
              )}
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={profile.studentId ? "default" : "secondary"}>
                  {profile.studentId ? t("associated") : t("loose")}
                </Badge>
              </div>
              {displayAge !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Idade</span>
                  <span className="text-sm">{displayAge} anos</span>
                </div>
              )}
              {displayPhone && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Telefone
                  </span>
                  <span className="text-sm">{displayPhone}</span>
                </div>
              )}
              {displayCity && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cidade</span>
                  <span className="text-sm">{displayCity}</span>
                </div>
              )}
            </div>
          </div>

          {/* Integration Progress */}
          <IntegrationProgress
            profile={profile}
            user={serializedUser}
            hasPlacement={hasPlacement}
          />
        </div>

        {/* Right Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <StudentProfileTabs
            user={serializedUser}
            profile={profile}
            allTeachers={serializedAllTeachers}
            activePlan={serializedActivePlan}
            templates={serializedTemplates}
          />
        </div>
      </div>
    </div>
  );
}
