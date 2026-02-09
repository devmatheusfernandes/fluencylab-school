"use client";

import React, { useMemo } from "react";
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
  isSameDay,
  startOfWeek,
  endOfWeek,
  differenceInDays,
  isValid,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface StudentProfileHeaderProps {
  student: Partial<User> | null;
  loading?: boolean;
}

export function StudentProfileHeader({
  student,
  loading = false,
}: StudentProfileHeaderProps) {
  // --- Derived State & Calculations ---

  const xp = student?.gamification?.currentXP || 0;
  const level = student?.gamification?.level || 1;
  const currentStreak = student?.gamification?.streak?.current || 0;
  const bestStreak = student?.gamification?.streak?.best || 0;
  const heatmapData = student?.gamification?.studyHeatmap || {};

  // Level Progress Calculation (Simple example: Level * 1000 XP needed)
  // You might want to adjust this based on your actual leveling logic
  const xpForCurrentLevel = (level - 1) * 1000;
  const xpForNextLevel = level * 1000;
  const xpProgress = Math.min(
    100,
    Math.max(
      0,
      ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100,
    ),
  );

  // Heatmap Generation
  // We want to show roughly the last 6 months or 1 year
  const heatmapDays = useMemo(() => {
    const today = new Date();
    // Show last ~24 weeks (approx 6 months) to fit nicely
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

  // --- Render Loading State ---
  if (loading) {
    return (
      <Card className="w-full overflow-hidden border-none shadow-sm bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar & Info Skeleton */}
            <div className="flex items-center gap-4 md:w-1/3">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full mt-2" />
              </div>
            </div>
            {/* Stats Skeleton */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>
          {/* Heatmap Skeleton */}
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
          {/* --- Left Column: Identity & Key Stats --- */}
          <div className="p-6 lg:w-[400px] xl:w-[450px] flex flex-col gap-6 border-b lg:border-b-0 lg:border-r border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            {/* Identity */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-800 shadow-lg">
                  <AvatarImage src={student?.avatarUrl || ""} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-2xl font-bold">
                    {student?.name?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm flex items-center gap-1">
                  <Medal size={10} />
                  <span>Lvl {level}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">
                  {student?.name || "Student"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-2">
                  {student?.email || "No email"}
                </p>

                {/* Level Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    <span>{xp} XP</span>
                    <span>Next: {xpForNextLevel} XP</span>
                  </div>
                  <Progress value={xpProgress} className="h-2 bg-slate-100" />
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-xl border border-orange-100 dark:border-orange-900/50 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-full mb-2 text-orange-600 dark:text-orange-400">
                  <Flame size={20} fill="currentColor" />
                </div>
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {currentStreak}
                </span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Day Streak
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
                  Total XP
                </span>
              </div>
            </div>
          </div>

          {/* --- Right Column: Activity Heatmap --- */}
          <div className="flex-1 p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-md text-emerald-600 dark:text-emerald-400">
                  <CalendarDays size={18} />
                </div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">
                  Study Activity
                </h3>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-muted/50 dark:bg-muted/20" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-200 dark:bg-emerald-900/50" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
                </div>
                <span>More</span>
              </div>
            </div>

            {/* Heatmap Grid */}
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
                            intensityClass,
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="text-center">
                          <p className="font-semibold">
                            {count} {count === 1 ? "activity" : "activities"}
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

            {/* Legend / Best Streak (Footer of Heatmap) */}
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 border-t pt-4 border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-indigo-500" />
                <span>
                  Best Streak:{" "}
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {bestStreak} days
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <UserIcon size={14} className="text-indigo-500" />
                <span>
                  Joined:{" "}
                  {student?.createdAt
                    ? format(new Date(student.createdAt), "MMM yyyy")
                    : "Recent"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
