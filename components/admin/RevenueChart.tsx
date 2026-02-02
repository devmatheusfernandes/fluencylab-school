"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations, useLocale } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data?: {
    month: string;
    revenue: number;
  }[];
  isLoading?: boolean;
}

const MinimalTooltip = ({ active, payload, label, locale }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-foreground text-background text-xs py-1 px-3 rounded shadow-xl font-medium">
        {label}:{" "}
        {new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "BRL",
          maximumFractionDigits: 0,
        }).format(payload[0].value)}
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const t = useTranslations("AdminDashboard.revenueChart");
  const locale = useLocale();

  if (isLoading) {
    return (
      <Card className="p-6 h-[350px] border-none shadow-sm bg-card/50 flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-xl" />
      </Card>
    );
  }

  return (
    <Card className="p-6 h-[350px] border-none shadow-sm bg-background/60 backdrop-blur-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg tracking-tight">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <div className="w-full h-[240px] min-w-0 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
            barSize={32}
          >
            <XAxis
              dataKey="month"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", dy: 10 }}
            />
            <YAxis
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${value / 1000}k`}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted)/0.3)", radius: 4 }}
              content={<MinimalTooltip locale={locale} />}
            />
            <Bar
              dataKey="revenue"
              fill="hsl(var(--primary))"
              radius={[4, 4, 4, 4]}
              className="opacity-90 hover:opacity-100 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
