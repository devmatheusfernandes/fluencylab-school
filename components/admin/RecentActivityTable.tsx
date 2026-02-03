"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";

interface RecentActivityTableProps {
  classes?: any[];
  isLoading?: boolean;
}

export default function RecentActivityTable({
  classes,
  isLoading,
}: RecentActivityTableProps) {
  const t = useTranslations("AdminDashboard.recentActivity");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  if (isLoading) {
    return (
      <Card className="p-6 border-none shadow-sm bg-card/50 space-y-4">
        <Skeleton className="h-6 w-32 mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center py-2">
            <div className="flex gap-3 items-center">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm overflow-hidden">
      <div className="p-6 pb-2">
        <h3 className="font-semibold text-lg tracking-tight">{t("title")}</h3>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="border-none">
            <TableRow className="border-b border-border/40 hover:bg-transparent">
              <TableHead className="pl-6 text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">
                {t("table.studentTeacher")}
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">
                {t("table.date")}
              </TableHead>
              <TableHead className="text-right pr-6 text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">
                {t("table.status")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes && classes.length > 0 ? (
              classes.map((cls, index) => (
                <TableRow
                  key={cls.id || index}
                  className="border-none hover:bg-muted/20 transition-colors cursor-default"
                >
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarImage src={cls.student?.photoUrl} />
                        <AvatarFallback />
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">
                          {cls.student?.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("table.with")} {cls.teacher?.name}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-sm text-muted-foreground font-medium">
                    {cls.scheduledAt
                      ? format(new Date(cls.scheduledAt), "dd MMM, HH:mm", {
                          locale: dateLocale,
                        })
                      : "-"}
                  </TableCell>
                  <TableCell className="pr-6 py-4 text-right">
                    <StatusDot status={cls.status} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground text-sm"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

// Minimalist Dot Status
function StatusDot({ status }: { status: string }) {
  const t = useTranslations("AdminDashboard.recentActivity.status");

  const colors = {
    completed: "bg-emerald-500",
    scheduled: "bg-blue-500",
    canceled: "bg-rose-500",
    pending: "bg-amber-500",
  };

  const key = status as keyof typeof colors;
  const color = colors[key] || "bg-gray-400";

  const label = ["completed", "scheduled", "canceled", "pending"].includes(key)
    ? t(key)
    : status;

  return (
    <div className="inline-flex items-center justify-end gap-2">
      <span className="text-xs font-medium text-muted-foreground capitalize">
        {label}
      </span>
      <span className={`h-2 w-2 rounded-full ${color}`} />
    </div>
  );
}
