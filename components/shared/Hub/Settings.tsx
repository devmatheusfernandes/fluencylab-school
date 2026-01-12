// app/hub/plataforma/settings/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserAdminRepository } from "@/repositories/user.admin.repository";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/settings/SettingsForm";
import ErrorAlert from "@/components/ui/error-alert";
import { Header } from "@/components/ui/header";
import { getTranslations } from "next-intl/server";

const userAdminRepo = new UserAdminRepository();

export default async function SettingsPage() {
  const t = await getTranslations("Settings");
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const user = await userAdminRepo.findUserById(session.user.id);

  if (!user) {
    return <ErrorAlert message={t("errors.userNotFound")} />;
  }

  // Check for Google Calendar connection status from URL parameters
  const googleCalendarConnected =
    session?.user?.role === "student" &&
    !!user.googleCalendarTokens?.accessToken;

  return (
    <div className="flex flex-col">
      <div className="px-4 md:px-6 pt-6 pb-2">
        <Header
          heading={t("header.title")}
          subheading={t("header.subtitle")}
        />
      </div>
      <SettingsForm
        currentLanguage={user.interfaceLanguage}
        currentTheme={user.theme || "dark"}
        currentThemeColor={user.themeColor}
        googleCalendarConnected={googleCalendarConnected}
        googleCalendarDefaultTimes={user.googleCalendarDefaultTimes}
      />
    </div>
  );
}
