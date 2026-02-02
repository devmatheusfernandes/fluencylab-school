"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface StatCardProps {
  title: string;
  value?: string | number;
  icon: React.ReactNode;
  trend?: number;
  isLoading?: boolean;
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  isLoading,
  className,
}: StatCardProps) {
  const t = useTranslations("AdminDashboard.stats");
  const hasTrend = trend !== undefined;
  const isPositive = hasTrend && trend >= 0;
  const isNeutral = hasTrend && trend === 0;

  if (isLoading) {
    return (
      <Card className="h-full p-6 flex flex-col justify-between border-none shadow-sm bg-card/50">
        <div className="flex justify-between w-full">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <div className="space-y-2 mt-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card
        className={cn(
          "h-full p-6 flex flex-col justify-between border-none shadow-sm hover:shadow-md transition-all duration-300 bg-background/60 backdrop-blur-sm",
          className,
        )}
      >
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-sm font-medium tracking-wide text-muted-foreground/80">
            {title}
          </span>
          {/* Ícone agora é sutil e parte da "textura" do card, não um destaque colorido */}
          <div className="opacity-40 scale-90 text-foreground">{icon}</div>
        </div>

        <div className="mt-4 space-y-1">
          <span className="text-3xl font-semibold tracking-tight text-foreground block">
            {value}
          </span>

          {hasTrend && (
            <div
              className={cn(
                "flex items-center text-xs font-medium",
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isNeutral
                    ? "text-muted-foreground"
                    : "text-rose-600 dark:text-rose-400",
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3 mr-1" />
              ) : isNeutral ? (
                <Minus className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-1" />
              )}
              <span>{Math.abs(trend * 100).toFixed(0)}%</span>
              <span className="text-muted-foreground/60 ml-1 font-normal">
                {t("vsLastMonth")}
              </span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
