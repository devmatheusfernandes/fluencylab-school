import { dashboardService } from "@/services/core/dashboardService";
import { getResendUsage } from "@/services/admin/resendUsageService";
import { getFirebaseUsage } from "@/services/admin/firebaseUsageService";
import DashboardClient from "@/components/admin/DashboardClient";
import ResendUsageWidget from "@/components/admin/ResendUsageWidget";
import FirebaseUsageWidget from "@/components/admin/FirebaseUsageWidget";
import { Header } from "@/components/ui/header";
import { DollarSign, Users, Calendar, GraduationCap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getStreamUsage } from "@/services/admin/streamUsageService";
import StreamUsageWidget from "@/components/admin/StreamUsageWidget";
import GeminiUsageWidget from "@/components/admin/GeminiUsageWidget";
import { getGeminiUsage } from "@/services/admin/geminiApiKeyUsageService";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  // Parse period, keeping it as string if it's a date range (YYYY-MM) or '24h'/'7d'
  const firebasePeriod =
    typeof resolvedSearchParams.firebase_period === "string"
      ? resolvedSearchParams.firebase_period
      : "30d";

  const [data, resendData, firebaseData, streamData, geminiData] =
    await Promise.all([
      dashboardService.getDashboardData(),
      getResendUsage(),
      getFirebaseUsage({ range: firebasePeriod }),
      getStreamUsage("30d"),
      getGeminiUsage(),
    ]);
  const t = await getTranslations("AdminDashboard");

  const icons = {
    revenue: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    newUsers: <Users className="h-4 w-4 text-muted-foreground" />,
    classesToday: <Calendar className="h-4 w-4 text-muted-foreground" />,
    activeTeachers: <GraduationCap className="h-4 w-4 text-muted-foreground" />,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Header heading={t("title")} subheading={t("subtitle")} />

      <DashboardClient data={data} icons={icons} />

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          {t("systemStatus")}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:row-span-3">
            <FirebaseUsageWidget data={firebaseData} />
          </div>
          <ResendUsageWidget data={resendData} />
          <StreamUsageWidget data={streamData} />
          <GeminiUsageWidget data={geminiData} />
        </div>
      </div>
    </div>
  );
}
