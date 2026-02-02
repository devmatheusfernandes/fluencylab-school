import { dashboardService } from "@/services/core/dashboardService";
import DashboardClient from "@/components/admin/DashboardClient";
import { Header } from "@/components/ui/header";
import { DollarSign, Users, Calendar, GraduationCap } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const data = await dashboardService.getDashboardData();
  const t = await getTranslations("AdminDashboard");

  const icons = {
    revenue: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    newUsers: <Users className="h-4 w-4 text-muted-foreground" />,
    classesToday: <Calendar className="h-4 w-4 text-muted-foreground" />,
    activeTeachers: <GraduationCap className="h-4 w-4 text-muted-foreground" />,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Header
        heading={t("title")}
        subheading={t("subtitle")}
      />

      <DashboardClient data={data} icons={icons} />
    </div>
  );
}
