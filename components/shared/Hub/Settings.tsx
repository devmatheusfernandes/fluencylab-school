// app/hub/plataforma/settings/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserAdminRepository } from "@/repositories/user.admin.repository";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/settings/SettingsForm";
import ErrorAlert from "@/components/ui/error-alert";

const userAdminRepo = new UserAdminRepository();

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const user = await userAdminRepo.findUserById(session.user.id);

  if (!user) {
    return <ErrorAlert message="Usuário não encontrado." />;
  }

  // Check for Google Calendar connection status from URL parameters
  const googleCalendarConnected =
    session?.user?.role === "student" &&
    !!user.googleCalendarTokens?.accessToken;

  return (
    <SettingsForm
      currentLanguage={user.interfaceLanguage}
      currentTheme={user.theme || "dark"}
      googleCalendarConnected={googleCalendarConnected}
      googleCalendarDefaultTimes={user.googleCalendarDefaultTimes}
    />
  );
}
