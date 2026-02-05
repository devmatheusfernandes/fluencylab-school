"use client";
import { motion, Variants } from "framer-motion";
import RecentActivityTable from "./RecentActivityTable";
import RevenueChart from "./RevenueChart";
import StatCard from "./StatCard";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

// Animação "Fade Up" suave e elegante
const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Mais rápido entre itens
      delayChildren: 0.1,
    },
  },
};

const item: Variants = {
  hidden: { y: 10, opacity: 0 }, // Movimento menor (10px) para ser mais sutil
  show: {
    y: 0,
    opacity: 1,
    transition: {
      type: "tween",
      ease: "easeOut",
      duration: 0.4,
    },
  },
};

export default function DashboardClient({
  data,
  icons,
}: {
  data: any;
  icons: any;
}) {
  const t = useTranslations("AdminDashboard");
  const locale = useLocale();
  const isLoading = !data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 mx-auto"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item}>
          <StatCard
            title={t("stats.monthlyRevenue")}
            value={data ? formatCurrency(data.monthlyRevenue) : undefined}
            icon={icons.revenue}
            trend={data?.revenueTrend}
            isLoading={isLoading}
          />
        </motion.div>

        <motion.div variants={item}>
          <StatCard
            title={t("stats.newStudents")}
            value={data ? `+${data.newUsersCount}` : undefined}
            icon={icons.newUsers}
            trend={0.12}
            isLoading={isLoading}
          />
        </motion.div>

        <motion.div variants={item}>
          <StatCard
            title={t("stats.todayClasses")}
            value={data?.classesTodayCount}
            icon={icons.classesToday}
            isLoading={isLoading}
          />
        </motion.div>

        <motion.div variants={item}>
          <StatCard
            title={t("stats.activeTeachers")}
            value={data?.activeTeachersCount}
            icon={icons.activeTeachers}
            isLoading={isLoading}
          />
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        {/* Gráfico Principal - Ocupa 4/7 do espaço */}

        <motion.div variants={item} className={cn("lg:col-span-4")}>
          <RevenueChart data={data?.revenueLast6Months} isLoading={isLoading} />
        </motion.div>

        {/* Tabela de Atividades - Ocupa 3/7 do espaço para balancear */}
        <motion.div variants={item} className={cn("lg:col-span-3")}>
          <RecentActivityTable
            classes={data?.recentClasses}
            isLoading={isLoading}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
