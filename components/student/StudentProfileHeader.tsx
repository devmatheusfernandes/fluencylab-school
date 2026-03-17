"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { User } from "@/types/users/users";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Flame,
  CalendarDays,
  Medal,
  TrendingUp,
  User as UserIcon,
} from "lucide-react";
import {
  format,
  subDays,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  getLevelBounds,
  getProgressInLevel,
  getLevelForXP,
} from "@/config/gamificationLevels";

interface StudentProfileHeaderProps {
  student: Partial<User> | null;
  loading?: boolean;
}

export function StudentProfileHeader({
  student,
  loading = false,
}: StudentProfileHeaderProps) {
  const t = useTranslations("StudentProfileHeader");
  const rawXP = student?.gamification?.currentXP;
  const xp =
    typeof rawXP === "string"
      ? parseInt(rawXP, 10)
      : typeof rawXP === "number" && Number.isFinite(rawXP)
        ? rawXP
        : 0;
  const level = getLevelForXP(xp);
  const currentStreak = student?.gamification?.streak?.current || 0;
  const bestStreak = student?.gamification?.streak?.best || 0;
  const heatmapData = student?.gamification?.studyHeatmap || {};
  const bounds = getLevelBounds(level);
  const xpForNextLevel = bounds.next ?? bounds.start;
  const xpProgress = getProgressInLevel(xp, level);

  const heatmapDays = useMemo(() => {
    const today = new Date();
    const weeksToShow = 24;
    const endDate = endOfWeek(today);
    const startDate = subDays(startOfWeek(today), (weeksToShow - 1) * 7);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, []);

  const getIntensityClass = (count: number) => {
    if (count === 0) return "bg-muted/50 dark:bg-muted/20";
    if (count < 2) return "bg-emerald-200 dark:bg-emerald-900/50";
    if (count < 5) return "bg-emerald-400 dark:bg-emerald-700";
    if (count < 10) return "bg-emerald-500 dark:bg-emerald-500";
    return "bg-emerald-600 dark:bg-emerald-400";
  };

  if (loading) {
    return (
      <Card className="w-full overflow-hidden border-none shadow-sm bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex items-center gap-4 md:w-1/3">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full mt-2" />
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>
          <div className="mt-8">
            <Skeleton className="h-4 w-32 mb-4" />
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 100 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-3 rounded-sm" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950/50">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          <div className="p-6 lg:w-[400px] xl:w-[450px] flex flex-col gap-6 border-b lg:border-b-0 lg:border-r border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar size="2xl">
                  <AvatarImage src={student?.avatarUrl || ""} />
                  <AvatarFallback />
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm flex items-center gap-1">
                  <Medal size={10} />
                  <span>{t("labels.level", { level })}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">
                  {student?.name || t("labels.studentFallback")}
                </h2>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    <span>{xp} XP</span>
                    <span>{t("labels.nextXP", { xp: xpForNextLevel })}</span>
                  </div>
                  <Progress value={xpProgress} className="h-2 bg-foreground" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-xl border border-orange-100 dark:border-orange-900/50 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-full mb-2 text-orange-600 dark:text-orange-400">
                  <Flame size={20} fill="currentColor" />
                </div>
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {currentStreak}
                </span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {t("labels.dayStreak")}
                </span>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full mb-2 text-indigo-600 dark:text-indigo-400">
                  <Trophy size={20} fill="currentColor" />
                </div>
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {xp}
                </span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {t("labels.totalXP")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-md text-emerald-600 dark:text-emerald-400">
                  <CalendarDays size={18} />
                </div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">
                  {t("activity.title")}
                </h3>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>{t("activity.less")}</span>
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-muted/50 dark:bg-muted/20" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-200 dark:bg-emerald-900/50" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
                </div>
                <span>{t("activity.more")}</span>
              </div>
            </div>

            <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              <div
                className="grid gap-1 min-w-fit"
                style={{
                  gridTemplateRows: "repeat(7, 1fr)",
                  gridAutoFlow: "column",
                }}
              >
                {heatmapDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const count = heatmapData[dateStr] || 0;
                  const intensityClass = getIntensityClass(count);

                  return (
                    <Tooltip key={dateStr} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "w-3 h-3 rounded-sm transition-all duration-300 hover:ring-2 hover:ring-offset-1 hover:ring-slate-400 dark:hover:ring-slate-500",
                            intensityClass
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="text-center">
                          <p className="font-semibold">
                            {count} {t("activity.count", { count })}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {format(day, "EEE, MMM d, yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 border-t pt-4 border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-indigo-500" />
                <span>
                  {t("labels.bestStreak")}:{" "}
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {bestStreak} {t("labels.daysLower")}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <UserIcon size={14} className="text-indigo-500" />
                <span>
                  {t("labels.joined")}:{" "}
                  {student?.createdAt
                    ? format(new Date(student.createdAt), "MMM yyyy")
                    : t("labels.recent")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
