// components/admin/dashboard/StatCard.tsx
"use client";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number; // Ex: 0.15 para +15%, -0.05 para -5%
}

export default function StatCard({ title, value, icon, trend }: StatCardProps) {
  const hasTrend = trend !== undefined;
  const isPositive = hasTrend && trend >= 0;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <Text variant="subtitle">{title}</Text>
        <div className="text-primary">{icon}</div>
      </div>
      <Text variant="title" size="2xl" weight="bold" className="mt-2">
        {value}
      </Text>
      {hasTrend && (
        <div
          className={`flex items-center text-xs mt-1 ${isPositive ? "text-success" : "text-danger"}`}
        >
          {isPositive ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
          <span>{Math.abs(trend * 100).toFixed(1)}% vs. período anterior</span>
        </div>
      )}
    </Card>
  );
}
